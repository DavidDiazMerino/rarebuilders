import { timingSafeEqual } from 'node:crypto'
import { requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { runSourceScan } from '../_lib/source-engine.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

function authorized(req: VercelRequest) {
  const secret = process.env.CRON_SECRET ?? ''
  const header = req.headers.authorization ?? ''
  const provided = Array.isArray(header) ? header[0] : header
  const token = provided.startsWith('Bearer ') ? provided.slice(7) : ''
  return Boolean(secret && token && secret.length === token.length
    && timingSafeEqual(Buffer.from(secret), Buffer.from(token)))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  if (!authorized(req)) {
    sendError(res, 401, 'cron_unauthorized', 'Cron authorization failed.', id)
    return
  }
  try {
    const result = await runSourceScan({ analysisLimit: 5 })
    sendData(res, result.run, { cached: false, requestId: id })
  } catch (error) {
    sendError(res, 503, 'scan_failed', error instanceof Error ? error.message : 'Source scan failed.', id)
  }
}
