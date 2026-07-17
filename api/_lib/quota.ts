import { createHash } from 'node:crypto'
import { getRedis } from './redis'

export type AiOperation = 'profile' | 'analysis' | 'strategy'

const perIpLimit: Record<AiOperation, number> = {
  profile: 1,
  analysis: 2,
  strategy: 2,
}

export async function reserveAiOperation(ip: string, operation: AiOperation) {
  const redis = getRedis()
  if (!redis) {
    return { ok: false as const, reason: 'AI safeguards are not configured. The cached demo remains available.' }
  }

  const globalLimit = Math.max(1, Number(process.env.AI_GLOBAL_OPERATION_LIMIT ?? 40))
  const globalKey = 'rarebuilders:ai:global:v1'
  const day = new Date().toISOString().slice(0, 10)
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 20)
  const ipKey = `rarebuilders:ai:ip:${day}:${operation}:${ipHash}`

  const globalCount = await redis.incr(globalKey)
  if (globalCount === 1) await redis.expire(globalKey, 60 * 60 * 24 * 45)
  if (globalCount > globalLimit) {
    await redis.decr(globalKey)
    return { ok: false as const, reason: 'The shared GPT-5.6 demo budget is exhausted. Cached results still work.' }
  }

  const ipCount = await redis.incr(ipKey)
  if (ipCount === 1) await redis.expire(ipKey, 60 * 60 * 26)
  if (ipCount > perIpLimit[operation]) {
    await Promise.all([redis.decr(ipKey), redis.decr(globalKey)])
    return { ok: false as const, reason: `This browser has reached today’s ${operation} limit. Try a cached source.` }
  }

  return { ok: true as const, globalCount, globalLimit, ipCount }
}
