import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from './concurrency'

describe('bounded concurrency', () => {
  it('preserves input order without exceeding the requested parallelism', async () => {
    let active = 0
    let peak = 0

    const results = await mapWithConcurrency([30, 5, 20, 10], 2, async (delay, index) => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, delay))
      active -= 1
      return `result-${index}`
    })

    expect(results).toEqual(['result-0', 'result-1', 'result-2', 'result-3'])
    expect(peak).toBe(2)
  })
})
