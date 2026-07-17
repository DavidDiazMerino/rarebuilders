import { z } from 'zod'
import { getRepositoryContext } from '../_lib/github'
import { publicMessage, requestId, requireMethod, sendData, sendError } from '../_lib/http'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types'

const querySchema = z.object({
  owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/),
  repo: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'GET', id)) return
  try {
    const { owner, repo } = querySchema.parse(req.query)
    const result = await getRepositoryContext(owner, repo)
    sendData(res, result.data, { cached: result.cached, requestId: id })
  } catch (error) {
    sendError(res, error instanceof z.ZodError ? 400 : 502, 'github_context_failed', publicMessage(error), id)
  }
}
