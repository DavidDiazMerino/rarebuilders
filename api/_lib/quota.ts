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

  try {
    const globalCount = await redis.incr(globalKey)
    if (globalCount === 1) await redis.expire(globalKey, 60 * 60 * 24 * 35)
    if (globalCount > globalLimit) {
      await redis.decr(globalKey)
      return { ok: false as const, reason: 'The shared GPT-5.6 demo budget is exhausted. Cached results still work.' }
    }

    const ipCount = await redis.incr(ipKey)
    if (ipCount === 1) await redis.expire(ipKey, 60 * 60 * 26)
    if (ipCount > (owner ? ownerDailyLimit : perIpLimit)[operation]) {
      await Promise.all([redis.decr(ipKey), redis.decr(globalKey)])
      return { ok: false as const, reason: `This browser has reached today’s ${operation} limit. Try a cached source.` }
    }

    return { ok: true as const, globalCount, globalLimit, ipCount }
  } catch {
    return { ok: false as const, reason: 'AI safeguards are temporarily unavailable. Cached results still work.' }
  }
}
