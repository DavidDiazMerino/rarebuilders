import { clientIp, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { reservePublicRequest } from '../_lib/rate-limit.js'
import { getSourceEngineState } from '../_lib/source-store.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  const reservation = await reservePublicRequest(clientIp(req), 'signal-feed', 120, 60 * 60)
  if (!reservation.ok) {
    res.setHeader('Retry-After', String(reservation.retryAfter))
    sendError(res, 429, 'rate_limited', 'Too many signal feed requests.', id)
    return
  }
  const state = await getSourceEngineState()
  const cursor = Array.isArray(req.query.cursor) ? req.query.cursor[0] : req.query.cursor ?? ''
  const requested = Number(Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit)
  const limit = Number.isSafeInteger(requested) ? Math.min(100, Math.max(1, requested)) : 50
  const unchanged = Boolean(cursor && cursor === state.updatedAt)
  const candidates = unchanged ? [] : state.candidates.slice(0, limit).map(({ sourceText: _sourceText, ...candidate }) => candidate)
  const candidateIds = new Set(candidates.map((candidate) => candidate.id))
  const opportunities = unchanged ? [] : state.opportunities.filter((opportunity) => opportunity.candidateId && candidateIds.has(opportunity.candidateId))
  const latestRun = state.runs[0]
  sendData(res, {
    cursor: state.updatedAt,
    candidates,
    opportunities,
    digest: latestRun ? {
      id: `digest-${latestRun.id}`,
      generatedAt: latestRun.completedAt ?? latestRun.startedAt,
      cursor: state.updatedAt,
      newSignals: latestRun.signalsFound,
      promotedSignals: latestRun.signalsPromoted,
      analysesUsed: latestRun.analysesUsed,
      sourceErrors: latestRun.errors.length,
      scanRunId: latestRun.id,
    } : null,
  }, { cached: false, requestId: id })
}
