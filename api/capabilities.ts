import { isOwnerRequest } from './_lib/owner-access.js'
import { requestId, requireMethod, sendData } from './_lib/http.js'
import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  const owner = isOwnerRequest(req)
  sendData(res, {
    owner,
    autoAnalysisChoices: owner ? [0, 2, 5] : [0],
    dailyLimits: owner
      ? { profile: 3, analysis: 10, strategy: 5 }
      : { profile: 1, analysis: 2, strategy: 2 },
  }, { cached: false, requestId: id })
}
