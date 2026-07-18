import { createHash } from 'node:crypto'
import { getRedis } from './redis.js'

export type AiOperation = 'profile' | 'analysis' | 'strategy'

const perIpLimit: Record<AiOperation, number> = {
  profile: 1,
  analysis: 2,
  strategy: 2,
}

const ownerDailyLimit: Record<AiOperation, number> = {
  profile: 3,
  analysis: 10,
  strategy: 5,
}

export function positiveInteger(value: string | undefined, fallback: number, maximum = 10_000) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback
}

export async function reserveAiOperation(ip: string, operation: AiOperation, owner = false) {
  const redis = getRedis()
  if (!redis) {
    return { ok: false as const, reason: 'AI safeguards are not configured. The cached demo remains available.' }
  }

  const globalLimit = positiveInteger(
    owner ? process.env.AI_OWNER_GLOBAL_OPERATION_LIMIT : process.env.AI_GLOBAL_OPERATION_LIMIT,
    owner ? 150 : 40,
  )
  const month = new Date().toISOString().slice(0, 7)
  const globalKey = `rarebuilders:ai:global:v2:${owner ? 'owner' : 'public'}:${month}`
  const day = new Date().toISOString().slice(0, 10)
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 20)
  const ipKey = `rarebuilders:ai:ip:v2:${owner ? 'owner' : 'public'}:${day}:${operation}:${ipHash}`
  const operationLimit = (owner ? ownerDailyLimit : perIpLimit)[operation]

  try {
    const result = await redis.eval(`
      local globalCount = tonumber(redis.call('GET', KEYS[1]) or '0')
      local clientCount = tonumber(redis.call('GET', KEYS[2]) or '0')
      local globalLimit = tonumber(ARGV[1])
      local clientLimit = tonumber(ARGV[2])
      if globalCount >= globalLimit then
        return {0, globalCount, clientCount, 1}
      end
      if clientCount >= clientLimit then
        return {0, globalCount, clientCount, 2}
      end
      globalCount = redis.call('INCR', KEYS[1])
      if globalCount == 1 then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3])) end
      clientCount = redis.call('INCR', KEYS[2])
      if clientCount == 1 then redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4])) end
      return {1, globalCount, clientCount, 0}
    `, [globalKey, ipKey], [globalLimit, operationLimit, 60 * 60 * 24 * 35, 60 * 60 * 26]) as Array<number | string>
    const [allowed, globalCount, ipCount, reason] = result.map(Number)
    if (!allowed && reason === 1) {
      return { ok: false as const, reason: 'The shared GPT-5.6 demo budget is exhausted. Cached results still work.' }
    }
    if (!allowed) {
      return { ok: false as const, reason: `This browser has reached today’s ${operation} limit. Try a cached source.` }
    }
    return { ok: true as const, globalCount, globalLimit, ipCount, operationLimit }
  } catch {
    return { ok: false as const, reason: 'AI safeguards are temporarily unavailable. Cached results still work.' }
  }
}

export function aiQuotaMeta(
  operation: AiOperation,
  reservation: Awaited<ReturnType<typeof reserveAiOperation>>,
) {
  if (!reservation.ok) return undefined
  const reset = new Date()
  reset.setUTCHours(24, 0, 0, 0)
  return {
    operation,
    remaining: Math.max(0, reservation.operationLimit - reservation.ipCount),
    limit: reservation.operationLimit,
    resetAt: reset.toISOString(),
  }
}
