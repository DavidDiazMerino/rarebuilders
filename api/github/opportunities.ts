import { z } from 'zod'
import { searchOpportunityIssues } from '../_lib/github'
import { publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types'

const querySchema = z.object({ q: z.string().min(2).max(240) })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  try {
    const { q } = querySchema.parse(req.query)
    const result = await searchOpportunityIssues(q)
    sendData(res, result.data, { cached: result.cached, requestId: id })
  } catch (error) {
    sendError(res, error instanceof z.ZodError ? 400 : 502, 'github_search_failed', publicMessage(error), id)
  }
}
