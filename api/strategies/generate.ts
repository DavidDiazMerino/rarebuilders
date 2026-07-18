import { z } from 'zod'
import { builderProfileSchema, opportunitySchema } from '../../shared/domain.js'
import { runAiOperation } from '../_lib/ai-operation.js'
import { clientIp, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { isOwnerRequest } from '../_lib/owner-access.js'
import {
  generateOpportunityStrategy,
  MODEL,
  opportunityStrategyCacheInput,
} from '../_lib/openai.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

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
      input: opportunityStrategyCacheInput(body),
      ip: clientIp(req),
      operation: 'strategy',
      owner: isOwnerRequest(req),
      create: () => generateOpportunityStrategy(body),
    })
    sendData(res, result.data, {
      cached: result.cached,
      requestId: id,
      model: MODEL,
      quota: result.quota,
    })
  } catch (error) {
    const message = publicMessage(error)
    const status = error instanceof z.ZodError ? 400 : message.includes('limit') || message.includes('budget') ? 429 : 503
    sendError(res, status, status === 400 ? 'invalid_input' : status === 429 ? 'quota_exhausted' : 'strategy_failed', message, id)
  }
}
