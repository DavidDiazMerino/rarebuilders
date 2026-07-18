import { describe, expect, it } from 'vitest'
import { reservePublicRequest } from './rate-limit'

describe('public endpoint safeguards', () => {
  it('limits repeated expensive work even without shared storage', async () => {
    const scope = `test-${crypto.randomUUID()}`

    const first = await reservePublicRequest('203.0.113.10', scope, 2, 60)
    const second = await reservePublicRequest('203.0.113.10', scope, 2, 60)
    const third = await reservePublicRequest('203.0.113.10', scope, 2, 60)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(third.ok).toBe(false)
    expect(third.retryAfter).toBeGreaterThan(0)
  })
})
