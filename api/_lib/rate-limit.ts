import { createHash } from 'node:crypto'
import { getRedis } from './redis.js'

type MemoryWindow = { count: number; expiresAt: number }

const memoryWindows = new Map<string, MemoryWindow>()

function hashedClient(ip: string) {
  return createHash('sha256').update(ip).digest('hex').slice(0, 20)
}

function memoryReservation(key: string, limit: number, windowSeconds: number) {
  const now = Date.now()
  const current = memoryWindows.get(key)
  const window = !current || current.expiresAt <= now
    ? { count: 0, expiresAt: now + windowSeconds * 1_000 }
    : current
  window.count += 1
  memoryWindows.set(key, window)

  if (memoryWindows.size > 1_000) {
    for (const [entryKey, entry] of memoryWindows) {
      if (entry.expiresAt <= now) memoryWindows.delete(entryKey)
    }
  }
  return {
    ok: window.count <= limit,
    remaining: Math.max(0, limit - window.count),
    retryAfter: Math.max(1, Math.ceil((window.expiresAt - now) / 1_000)),
  }
}

export async function reservePublicRequest(
  ip: string,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const safeLimit = Math.max(1, Math.floor(limit))
  const safeWindow = Math.max(1, Math.floor(windowSeconds))
  const bucket = Math.floor(Date.now() / (safeWindow * 1_000))
  const key = `rarebuilders:rate:${scope}:${bucket}:${hashedClient(ip)}`
  const redis = getRedis()

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, safeWindow + 5)
      return {
        ok: count <= safeLimit,
        remaining: Math.max(0, safeLimit - count),
        retryAfter: safeWindow,
      }
    } catch {
      // The local guard still limits a hot serverless instance if Redis is unavailable.
    }
  }
  return memoryReservation(key, safeLimit, safeWindow)
}
