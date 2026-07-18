import { createHash } from 'node:crypto'
import { getCached, setCached } from './redis.js'

const inFlight = new Map<string, Promise<unknown>>()

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
  if (cached !== null) return { data: cached, cached: true, key }

  const pending = inFlight.get(key) as Promise<T> | undefined
  if (pending) return { data: await pending, cached: true, key }

  const operation = (async () => {
    const data = await create()
    await setCached(key, data, seconds)
    return data
  })()
  inFlight.set(key, operation)

  try {
    return { data: await operation, cached: false, key }
  } finally {
    if (inFlight.get(key) === operation) inFlight.delete(key)
  }
}
