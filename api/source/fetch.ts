import { z } from 'zod'
import { cachedResult } from '../_lib/cache.js'
import { publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { fetchPublicSource } from '../_lib/safe-fetch.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const requestSchema = z.object({ url: z.string().url().max(2_000) })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  try {
    const { url } = requestSchema.parse(req.body)
    const result = await cachedResult('source-v1', { url }, () => fetchPublicSource(url), 60 * 60)
    sendData(res, result.data, { cached: result.cached, requestId: id })
  } catch (error) {
    const message = publicMessage(error)
    sendError(res, error instanceof z.ZodError ? 400 : 422, 'source_fetch_failed', message, id)
  }
}
