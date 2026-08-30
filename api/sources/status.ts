import { isOwnerRequest } from '../_lib/owner-access.js'
import { requestId, requireMethod, sendData } from '../_lib/http.js'
import { cronAnalysisUsage, getSourceEngineState } from '../_lib/source-store.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  const owner = isOwnerRequest(req)
  const state = await getSourceEngineState()
  const latest = state.runs[0]
  sendData(res, {
    owner,
    updatedAt: state.updatedAt || null,
    latestRun: latest ? {
      ...latest,
      errors: owner ? latest.errors : latest.errors.map(() => 'A source was temporarily unavailable.'),
    } : null,
    sourceCount: Object.keys(state.subscriptions).length,
    signalCount: state.signals.length,
    candidateCount: state.candidates.length,
    pausedPackIds: owner ? state.pausedPackIds : [],
    monthlyAnalysisUsage: owner ? await cronAnalysisUsage() : undefined,
  }, { cached: false, requestId: id })
}
