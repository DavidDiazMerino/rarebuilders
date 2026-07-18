import { cachedResult } from './cache.js'
import { PublicError } from './http.js'
import { aiQuotaMeta, reserveAiOperation, type AiOperation } from './quota.js'

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
  let quota: ReturnType<typeof aiQuotaMeta>
  const result = await cachedResult(namespace, input, async () => {
    const reservation = await reserveAiOperation(ip, operation, owner)
    if (!reservation.ok) throw new PublicError(reservation.reason)
    quota = aiQuotaMeta(operation, reservation)
    return create()
  })
  return { data: result.data, cached: result.cached, quota }
}
