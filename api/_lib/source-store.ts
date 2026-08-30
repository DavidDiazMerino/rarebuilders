import type {
  Opportunity,
  OpportunityCandidate,
  RawSignal,
  ScanRun,
  SourceSubscription,
} from '../../shared/domain.js'
import { getRedis } from './redis.js'

const STATE_KEY = 'rarebuilders:sources:global:v1'
const LOCK_KEY = 'rarebuilders:sources:scan-lock:v1'

export type SourceEngineState = {
  subscriptions: Record<string, SourceSubscription>
  signals: RawSignal[]
  candidates: OpportunityCandidate[]
  opportunities: Opportunity[]
  runs: ScanRun[]
  pausedPackIds: string[]
  updatedAt: string
}

export const emptySourceEngineState = (): SourceEngineState => ({
  subscriptions: {},
  signals: [],
  candidates: [],
  opportunities: [],
  runs: [],
  pausedPackIds: [],
  updatedAt: '',
})

export function mergeSignals(existing: RawSignal[], incoming: RawSignal[]) {
  const items = new Map(existing.map((signal) => [signal.id, signal]))
  for (const signal of incoming) {
    const previous = items.get(signal.id)
    items.set(signal.id, previous?.contentHash === signal.contentHash
      ? { ...previous, observedAt: signal.observedAt }
      : { ...signal, changeKind: previous ? 'updated' : signal.changeKind })
  }
  return [...items.values()]
    .sort((left, right) => right.observedAt.localeCompare(left.observedAt))
    .slice(0, 500)
}

export function mergeCandidates(existing: OpportunityCandidate[], incoming: OpportunityCandidate[]) {
  const items = new Map(existing.map((candidate) => [candidate.id, candidate]))
  for (const candidate of incoming) {
    const previous = items.get(candidate.id)
    items.set(candidate.id, previous ? { ...candidate, discoveredAt: previous.discoveredAt } : candidate)
  }
  return [...items.values()]
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
    .slice(0, 250)
}

export async function getSourceEngineState(): Promise<SourceEngineState> {
  const redis = getRedis()
  if (!redis) return emptySourceEngineState()
  try {
    return await redis.get<SourceEngineState>(STATE_KEY) ?? emptySourceEngineState()
  } catch {
    return emptySourceEngineState()
  }
}

export async function saveSourceEngineState(state: SourceEngineState) {
  const redis = getRedis()
  if (!redis) throw new Error('Source persistence is not configured.')
  await redis.set(STATE_KEY, { ...state, updatedAt: new Date().toISOString() })
}

export async function acquireScanLock(runId: string) {
  const redis = getRedis()
  if (!redis) return false
  const result = await redis.set(LOCK_KEY, runId, { nx: true, ex: 60 * 10 })
  return result === 'OK'
}

export async function releaseScanLock(runId: string) {
  const redis = getRedis()
  if (!redis) return
  await redis.eval(`
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    end
    return 0
  `, [LOCK_KEY], [runId])
}

export async function reserveCronAnalysis() {
  const redis = getRedis()
  if (!redis) return false
  const configured = Number(process.env.AI_CRON_MONTHLY_LIMIT)
  const limit = Number.isSafeInteger(configured) && configured > 0 ? Math.min(configured, 500) : 50
  const month = new Date().toISOString().slice(0, 7)
  const key = `rarebuilders:ai:cron:v1:${month}`
  const result = await redis.eval(`
    local count = tonumber(redis.call('GET', KEYS[1]) or '0')
    if count >= tonumber(ARGV[1]) then return {0, count} end
    count = redis.call('INCR', KEYS[1])
    if count == 1 then redis.call('EXPIRE', KEYS[1], 3024000) end
    return {1, count}
  `, [key], [limit]) as Array<number | string>
  return Number(result[0]) === 1
}

export async function cronAnalysisUsage() {
  const redis = getRedis()
  if (!redis) return 0
  const month = new Date().toISOString().slice(0, 7)
  return Number(await redis.get(`rarebuilders:ai:cron:v1:${month}`) ?? 0)
}
