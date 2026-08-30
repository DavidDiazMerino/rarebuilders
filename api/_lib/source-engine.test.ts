import { describe, expect, it } from 'vitest'
import type { RawSignal } from '../../shared/domain'
import { materiallyChangedSignals } from './source-engine'

const signal = (id: string, hash: string): RawSignal => ({
  id, subscriptionId: 'source', sourcePackId: 'pack', adapterId: 'page-monitor', scope: { type: 'global' }, privacy: 'public',
  externalId: id, title: id, summary: 'Applications open with prize and deadline.', observedAt: '2026-08-30T10:00:00Z',
  publishedAt: null, contentHash: hash, changeKind: 'new', promotionStatus: 'promoted', promotionReasons: [], suppressionReasons: [], preliminaryScore: 80,
})

describe('source scan change gate', () => {
  it('sends no unchanged observation to promotion or automatic analysis', () => {
    expect(materiallyChangedSignals([signal('one', 'same')], [signal('one', 'same')])).toEqual([])
  })

  it('keeps new and materially updated observations', () => {
    expect(materiallyChangedSignals(
      [signal('one', 'old')],
      [signal('one', 'new'), signal('two', 'first')],
    ).map((item) => item.id)).toEqual(['one', 'two'])
  })
})
