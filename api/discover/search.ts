import { z } from 'zod'
import { mapWithConcurrency } from '../_lib/concurrency.js'
import { clientIp, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { reservePublicRequest } from '../_lib/rate-limit.js'
import { hasSourceAdapter, searchRegisteredSource } from '../_lib/source-registry.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const requestSchema = z.object({
  connectors: z.array(z.string().min(1).max(80)).min(1).max(8)
    .refine((ids) => ids.every((id) => hasSourceAdapter(id)), 'Unknown source adapter.'),
  query: z.string().max(240).default(''),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const reservation = await reservePublicRequest(clientIp(req), 'discovery', 80, 60 * 60)
    if (!reservation.ok) {
      res.setHeader('Retry-After', reservation.retryAfter)
      sendError(res, 429, 'discovery_rate_limited', 'Too many discovery refreshes. Try again later.', id)
      return
    }
    const body = requestSchema.parse(req.body)
    // Two workers cut aggregate wait time without hammering public catalogues.
    // Each connector still isolates its own timeout and failure.
    const results = await mapWithConcurrency(
      body.connectors,
      2,
      (connector) => searchRegisteredSource(connector, body.query),
    )
    sendData(res, results, { cached: false, requestId: id })
  } catch (error) {
    sendError(
      res,
      400,
      'invalid_discovery_search',
      error instanceof z.ZodError ? 'Select between one and eight available source adapters.' : 'Discovery search could not be parsed.',
      id,
    )
  }
}
