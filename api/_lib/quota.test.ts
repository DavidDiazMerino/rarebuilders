import { describe, expect, it } from 'vitest'
import { reserveAiOperation } from './quota'

describe('AI spend guard', () => {
  it('fails closed when shared quota storage is not configured', async () => {
    const result = await reserveAiOperation('127.0.0.1', 'analysis')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/safeguards are not configured/i)
  })
})
