import { describe, expect, it } from 'vitest'
import { sourcePackSchema } from './domain'
import { activeSubscriptions, sourcePacks } from './source-packs'

describe('source packs', () => {
  it('ships five validated, globally scoped packs', () => {
    expect(sourcePacks.map((pack) => sourcePackSchema.parse(pack))).toHaveLength(5)
    expect(sourcePacks.filter((pack) => pack.wildcard)).toHaveLength(1)
    expect(sourcePacks.flatMap((pack) => pack.subscriptions).every((source) => source.scope.type === 'global')).toBe(true)
  })

  it('activates packs idempotently', () => {
    const sources = activeSubscriptions(['sports-vision', 'sports-vision'])
    expect(new Set(sources.map((source) => source.id)).size).toBe(sources.length)
    expect(sources.every((source) => source.sourcePackId === 'sports-vision')).toBe(true)
  })
})
