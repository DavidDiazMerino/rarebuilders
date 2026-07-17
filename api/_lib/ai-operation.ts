import { contentHash } from './cache.js'
import { getCached, setCached } from './redis.js'
import { reserveAiOperation, type AiOperation } from './quota.js'

export async function runAiOperation<T>({
  namespace,
  input,
  ip,
  operation,
  create,
}: {
  namespace: string
  input: unknown
  ip: string
  operation: AiOperation
  create: () => Promise<T>
}) {
  const key = `rarebuilders:cache:${namespace}:${contentHash(input)}`
  const cached = await getCached<T>(key)
  if (cached) return { data: cached, cached: true }

  const quota = await reserveAiOperation(ip, operation)
  if (!quota.ok) throw new Error(quota.reason)
  const data = await create()
  await setCached(key, data, 60 * 60 * 24 * 30)
  return { data, cached: false }
}
