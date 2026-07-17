import { z } from 'zod'
import { builderProfileSchema, opportunitySchema } from '../../shared/domain'
import { runAiOperation } from '../_lib/ai-operation'
import { clientIp, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http'
import { generateOpportunityStrategy, MODEL } from '../_lib/openai'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types'

const requestSchema = z.object({
  opportunity: opportunitySchema,
  profile: builderProfileSchema,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const body = requestSchema.parse(req.body)
    const result = await runAiOperation({
      namespace: 'strategy-v1',
      input: body,
      ip: clientIp(req),
      operation: 'strategy',
      create: () => generateOpportunityStrategy(body),
    })
    sendData(res, result.data, { cached: result.cached, requestId: id, model: MODEL })
  } catch (error) {
    const message = publicMessage(error)
    const status = error instanceof z.ZodError ? 400 : message.includes('limit') || message.includes('budget') ? 429 : 503
    sendError(res, status, status === 400 ? 'invalid_input' : status === 429 ? 'quota_exhausted' : 'strategy_failed', message, id)
  }
}
