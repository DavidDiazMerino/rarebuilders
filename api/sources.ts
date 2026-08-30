import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { sourcePacks } from '../shared/source-packs.js'
import { clientIp, requestId, requireMethod, sendData, sendError } from './_lib/http.js'
import { isOwnerRequest } from './_lib/owner-access.js'
import { reservePublicRequest } from './_lib/rate-limit.js'
import { runSourceScan } from './_lib/source-engine.js'
import { sourceCapabilities } from './_lib/source-registry.js'
import {
  acquireScanLock,
  cronAnalysisUsage,
  getSourceEngineState,
  releaseScanLock,
  saveSourceEngineState,
} from './_lib/source-store.js'
import type { VercelRequest, VercelResponse } from './_lib/vercel-types.js'

const controlSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause'), packId: z.string() }),
  z.object({ action: z.literal('resume'), packId: z.string() }),
  z.object({ action: z.literal('dry-run') }),
  z.object({ action: z.literal('scan') }),
])

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? ''
}

function capabilities(req: VercelRequest, res: VercelResponse, id: string) {
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

async function status(req: VercelRequest, res: VercelResponse, id: string) {
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

async function feed(req: VercelRequest, res: VercelResponse, id: string) {
  if (!requireMethod(req, res, 'GET', id)) return
  const reservation = await reservePublicRequest(clientIp(req), 'signal-feed', 120, 60 * 60)
  if (!reservation.ok) {
    res.setHeader('Retry-After', String(reservation.retryAfter))
    sendError(res, 429, 'rate_limited', 'Too many signal feed requests.', id)
    return
  }
  const state = await getSourceEngineState()
  const cursor = queryValue(req.query.cursor)
  const requested = Number(queryValue(req.query.limit))
  const limit = Number.isSafeInteger(requested) ? Math.min(100, Math.max(1, requested)) : 50
  const unchanged = Boolean(cursor && cursor === state.updatedAt)
  const candidates = unchanged ? [] : state.candidates.slice(0, limit).map(({ sourceText: _sourceText, ...candidate }) => candidate)
  const candidateIds = new Set(candidates.map((candidate) => candidate.id))
  const opportunities = unchanged ? [] : state.opportunities.filter((opportunity) => opportunity.candidateId && candidateIds.has(opportunity.candidateId))
  const latestRun = state.runs[0]
  sendData(res, {
    cursor: state.updatedAt,
    candidates,
    opportunities,
    digest: latestRun ? {
      id: `digest-${latestRun.id}`,
      generatedAt: latestRun.completedAt ?? latestRun.startedAt,
      cursor: state.updatedAt,
      newSignals: latestRun.signalsFound,
      promotedSignals: latestRun.signalsPromoted,
      analysesUsed: latestRun.analysesUsed,
      sourceErrors: latestRun.errors.length,
      scanRunId: latestRun.id,
    } : null,
  }, { cached: false, requestId: id })
}

async function control(req: VercelRequest, res: VercelResponse, id: string) {
  if (!requireMethod(req, res, 'POST', id)) return
  if (!isOwnerRequest(req)) {
    sendError(res, 403, 'owner_required', 'Owner access is required.', id)
    return
  }
  try {
    const input = controlSchema.parse(req.body)
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = requestId(req)
  switch (queryValue(req.query.action)) {
    case 'capabilities': return capabilities(req, res, id)
    case 'status': return status(req, res, id)
    case 'feed': return feed(req, res, id)
    case 'control': return control(req, res, id)
    default: return sendError(res, 404, 'source_action_not_found', 'Unknown source action.', id)
  }
}
