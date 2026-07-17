import { Redis } from '@upstash/redis'

let redis: Redis | null | undefined

export function getRedis() {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    return await client.get<T>(key)
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown, seconds: number) {
  const client = getRedis()
  if (!client) return
  try {
    await client.set(key, value, { ex: seconds })
  } catch {
    // Cache failure must not discard a successful connector or model result.
  }
}
