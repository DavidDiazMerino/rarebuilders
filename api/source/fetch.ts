import { z } from 'zod'
import { cachedResult } from '../_lib/cache.js'
import { clientIp, publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { reservePublicRequest } from '../_lib/rate-limit.js'
import { fetchPublicSource } from '../_lib/safe-fetch.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const requestSchema = z.object({ url: z.string().url().max(2_000) })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const reservation = await reservePublicRequest(clientIp(req), 'source-fetch', 40, 60 * 60)
    if (!reservation.ok) {
      res.setHeader('Retry-After', reservation.retryAfter)
      sendError(res, 429, 'source_rate_limited', 'Too many source imports. Try again later.', id)
      return
    }
    const { url } = requestSchema.parse(req.body)
    const normalized = new URL(url)
    normalized.hash = ''
    const sourceUrl = normalized.toString()
    const result = await cachedResult(
      'source-v2',
      { url: sourceUrl },
      () => fetchPublicSource(sourceUrl),
      60 * 60,
    )
    sendData(res, result.data, { cached: result.cached, requestId: id })
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Enter a valid public HTTP or HTTPS URL.'
      : publicMessage(error, 'The source could not be imported.')
    sendError(res, error instanceof z.ZodError ? 400 : 422, 'source_fetch_failed', message, id)
  }
}
