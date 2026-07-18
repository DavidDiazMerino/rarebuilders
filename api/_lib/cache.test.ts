import { describe, expect, it } from 'vitest'
import { cachedResult } from './cache'

describe('request coalescing', () => {
  it('runs identical work only once while the first request is in flight', async () => {
    let creations = 0
    const create = async () => {
      creations += 1
      await new Promise((resolve) => setTimeout(resolve, 20))
      return [] as string[]
    }
    const input = { unique: crypto.randomUUID() }

    const [first, second] = await Promise.all([
      cachedResult('coalescing-test', input, create),
      cachedResult('coalescing-test', input, create),
    ])

    expect(creations).toBe(1)
    expect(first.data).toEqual([])
    expect(second.data).toEqual([])
    expect([first.cached, second.cached].sort()).toEqual([false, true])
  })
})
