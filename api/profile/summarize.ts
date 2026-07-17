import { z } from 'zod'
import { runAiOperation } from '../_lib/ai-operation'
import { clientIp, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http'
import { MODEL, summarizeBuilderMemory } from '../_lib/openai'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types'

const requestSchema = z.object({
  notes: z.array(z.object({
    name: z.string().max(200),
    content: z.string().max(15_000),
  })).max(12),
  repositories: z.array(z.object({
    name: z.string().max(200),
    url: z.string().url(),
    description: z.string().max(2_000),
    languages: z.array(z.string()).max(30),
    topics: z.array(z.string()).max(30),
    readme: z.string().max(12_000),
  })).max(8),
}).refine((value) => value.notes.length + value.repositories.length > 0, {
  message: 'Select at least one note or repository.',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const body = requestSchema.parse(req.body)
    const result = await runAiOperation({
      namespace: 'profile-v1',
      input: body,
      ip: clientIp(req),
      operation: 'profile',
      create: () => summarizeBuilderMemory(body),
    })
    sendData(res, result.data, { cached: result.cached, requestId: id, model: MODEL })
  } catch (error) {
    const message = publicMessage(error)
    const status = error instanceof z.ZodError ? 400 : message.includes('limit') || message.includes('budget') ? 429 : 503
    sendError(res, status, status === 400 ? 'invalid_input' : status === 429 ? 'quota_exhausted' : 'profile_analysis_failed', message, id)
  }
}
