import { z } from 'zod'
import { listPublicRepositories } from '../_lib/github'
import { publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types'

const querySchema = z.object({ username: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/) })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  try {
    const { username } = querySchema.parse(req.query)
    const result = await listPublicRepositories(username)
    sendData(res, result.data, { cached: result.cached, requestId: id })
  } catch (error) {
    sendError(res, error instanceof z.ZodError ? 400 : 502, 'github_repositories_failed', publicMessage(error), id)
  }
}
