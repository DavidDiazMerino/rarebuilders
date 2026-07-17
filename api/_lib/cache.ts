import { createHash } from 'node:crypto'
import { getCached, setCached } from './redis.js'

export function contentHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export async function cachedResult<T>(
  namespace: string,
  input: unknown,
  create: () => Promise<T>,
  seconds = 60 * 60 * 24 * 30,
) {
  const key = `rarebuilders:cache:${namespace}:${contentHash(input)}`
  const cached = await getCached<T>(key)
  if (cached) return { data: cached, cached: true, key }
  const data = await create()
  await setCached(key, data, seconds)
  return { data, cached: false, key }
}
