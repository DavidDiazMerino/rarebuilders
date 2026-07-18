import { z } from 'zod'
import { runAiOperation } from '../_lib/ai-operation.js'
import { clientIp, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { isOwnerRequest } from '../_lib/owner-access.js'
import {
  analyzeOpportunitySource,
  MODEL,
  opportunityAnalysisCacheInput,
} from '../_lib/openai.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const requestSchema = z.object({
  sourceUrl: z.string().max(2_000),
  sourceText: z.string().min(80).max(30_000),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const body = requestSchema.parse(req.body)
    const result = await runAiOperation({
      namespace: 'opportunity-v2',
      input: opportunityAnalysisCacheInput(body),
      ip: clientIp(req),
      operation: 'analysis',
      owner: isOwnerRequest(req),
      create: () => analyzeOpportunitySource(body),
    })
    sendData(res, { ...result.data, sourceUrl: body.sourceUrl }, {
      cached: result.cached,
      requestId: id,
      model: MODEL,
      quota: result.quota,
    })
  } catch (error) {
    const message = publicMessage(error)
    const status = error instanceof z.ZodError ? 400 : message.includes('limit') || message.includes('budget') ? 429 : 503
    sendError(res, status, status === 400 ? 'invalid_input' : status === 429 ? 'quota_exhausted' : 'analysis_failed', message, id)
  }
}
