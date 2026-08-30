import { describe, expect, it } from 'vitest'
import type { RawSignal } from '../../shared/domain'
import { mergeSignals } from './source-store'

const signal = (observedAt: string, contentHash: string): RawSignal => ({
  id: 'same-signal', subscriptionId: 'source', sourcePackId: 'pack', adapterId: 'page-monitor',
  scope: { type: 'global' }, privacy: 'public', externalId: 'external', title: 'Call', summary: 'Prize deadline',
  observedAt, publishedAt: null, contentHash, changeKind: 'new', promotionStatus: 'promoted',
  promotionReasons: ['Prize'], suppressionReasons: [], preliminaryScore: 80,
})

describe('source engine state', () => {
  it('updates observation time without duplicating unchanged signals', () => {
    const result = mergeSignals([signal('2026-08-01T00:00:00Z', 'same')], [signal('2026-08-02T00:00:00Z', 'same')])
    expect(result).toHaveLength(1)
    expect(result[0].observedAt).toBe('2026-08-02T00:00:00Z')
  })

  it('marks a known signal as updated when content changes', () => {
    const result = mergeSignals([signal('2026-08-01T00:00:00Z', 'old')], [signal('2026-08-02T00:00:00Z', 'new')])
    expect(result[0].changeKind).toBe('updated')
  })
})
