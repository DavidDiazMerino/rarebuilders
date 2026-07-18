import { cachedResult } from './cache.js'
import { PublicError } from './http.js'
import { reserveAiOperation, type AiOperation } from './quota.js'

export async function runAiOperation<T>({
  namespace,
  input,
  ip,
  operation,
  owner = false,
  create,
}: {
  namespace: string
  input: unknown
  ip: string
  operation: AiOperation
  owner?: boolean
  create: () => Promise<T>
}) {
  const result = await cachedResult(namespace, input, async () => {
    const quota = await reserveAiOperation(ip, operation, owner)
    if (!quota.ok) throw new PublicError(quota.reason)
    return create()
  })
  return { data: result.data, cached: result.cached }
}
