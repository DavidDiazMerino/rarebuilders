import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { sourcePacks } from '../../shared/source-packs.js'
import { requestId, requireMethod, sendData, sendError } from '../_lib/http.js'
import { isOwnerRequest } from '../_lib/owner-access.js'
import { runSourceScan } from '../_lib/source-engine.js'
import { acquireScanLock, getSourceEngineState, releaseScanLock, saveSourceEngineState } from '../_lib/source-store.js'
import type { VercelRequest, VercelResponse } from '../_lib/vercel-types.js'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause'), packId: z.string() }),
  z.object({ action: z.literal('resume'), packId: z.string() }),
  z.object({ action: z.literal('dry-run') }),
  z.object({ action: z.literal('scan') }),
])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  if (!requireMethod(req, res, 'POST', id)) return
  if (!isOwnerRequest(req)) {
    sendError(res, 403, 'owner_required', 'Owner access is required.', id)
    return
  }
  try {
    const input = schema.parse(req.body)
    if (input.action === 'dry-run' || input.action === 'scan') {
      const result = await runSourceScan({ dryRun: input.action === 'dry-run', analysisLimit: input.action === 'scan' ? 5 : 0 })
      sendData(res, result.run, { cached: false, requestId: id })
      return
    }
    if (!sourcePacks.some((pack) => pack.id === input.packId)) throw new Error('Unknown source pack.')
    const controlId = `control-${randomUUID()}`
    const locked = await acquireScanLock(controlId)
    if (!locked) {
      sendError(res, 409, 'source_engine_busy', 'A scan is running or source persistence is unavailable.', id)
      return
    }
    try {
      const state = await getSourceEngineState()
      const paused = new Set(state.pausedPackIds)
      if (input.action === 'pause') paused.add(input.packId)
      else paused.delete(input.packId)
      state.pausedPackIds = [...paused]
      await saveSourceEngineState(state)
      sendData(res, { pausedPackIds: state.pausedPackIds }, { cached: false, requestId: id })
    } finally {
      await releaseScanLock(controlId)
    }
  } catch (error) {
    sendError(res, 400, 'invalid_source_control', error instanceof Error ? error.message : 'Invalid source control request.', id)
  }
}
