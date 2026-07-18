import { z } from 'zod'
import { aiQuotaMeta, reserveAiOperation } from '../_lib/quota.js'
import { clientIp, PublicError, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { analyzeCareerDocument, MODEL } from '../_lib/openai.js'
import { isOwnerRequest } from '../_lib/owner-access.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
] as const

const requestSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.enum(allowedTypes),
  base64: z.string().min(16).max(2_800_000),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const body = requestSchema.parse(req.body)
    const estimatedBytes = Math.floor(body.base64.length * 0.75)
    if (estimatedBytes > 2_000_000) throw new PublicError('The CV exceeds the 2 MB import limit.')
    const quota = await reserveAiOperation(clientIp(req), 'profile', isOwnerRequest(req))
    if (!quota.ok) throw new PublicError(quota.reason)
    const data = await analyzeCareerDocument(body)
    sendData(res, data, {
      cached: false,
      requestId: id,
      model: MODEL,
      quota: aiQuotaMeta('profile', quota),
    })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Supported CV formats are PDF, DOC, DOCX, TXT and Markdown up to 2 MB.'
      : publicMessage(error)
    const status = error instanceof z.ZodError ? 400 : message.includes('limit') ? 429 : 503
    sendError(res, status, status === 400 ? 'invalid_cv' : status === 429 ? 'quota_exhausted' : 'cv_analysis_failed', message, id)
  }
}
