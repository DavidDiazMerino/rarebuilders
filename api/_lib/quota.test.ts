import { describe, expect, it } from 'vitest'
import { positiveInteger, reserveAiOperation } from './quota'

describe('AI spend guard', () => {
  it('fails closed when shared quota storage is not configured', async () => {
    const result = await reserveAiOperation('127.0.0.1', 'analysis')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toMatch(/safeguards are not configured/i)
  })

  it('falls back safely for malformed or extreme environment limits', () => {
    expect(positiveInteger('not-a-number', 40)).toBe(40)
    expect(positiveInteger('-2', 40)).toBe(40)
    expect(positiveInteger('999999999', 40)).toBe(10_000)
    expect(positiveInteger('120', 40)).toBe(120)
  })
})
