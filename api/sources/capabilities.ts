import { sourcePacks } from '../../shared/source-packs.js'
import { requestId, requireMethod, sendData } from '../_lib/http.js'
import { sourceCapabilities } from '../_lib/source-registry.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  sendData(res, {
    capabilities: sourceCapabilities(),
    packs: sourcePacks.map((pack) => ({
      id: pack.id,
      label: pack.label,
      description: pack.description,
      wildcard: pack.wildcard,
      sourceCount: pack.subscriptions.length,
    })),
  }, { cached: false, requestId: id })
}
