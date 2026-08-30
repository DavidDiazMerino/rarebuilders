import { describe, expect, it } from 'vitest'
import type { RawSignal, SourceSubscription } from './domain'
import { candidateFromSignal, promoteSignal } from './opportunity-signals'

const subscription: SourceSubscription = {
  id: 'source', adapterId: 'page-monitor', sourcePackId: 'hardware-robotics', label: 'Official calls', kind: 'page',
  scope: { type: 'global' }, privacy: 'public', cadence: 'twice-weekly', endpoint: 'https://example.com/calls',
  positiveTerms: ['hardware kit'], negativeTerms: ['archive'], languages: ['English'], trust: 90, enabled: true,
}
const signal: RawSignal = {
  id: 'signal', subscriptionId: 'source', sourcePackId: 'hardware-robotics', adapterId: 'page-monitor',
  scope: { type: 'global' }, privacy: 'public', externalId: '1', canonicalUrl: 'https://example.com/calls/1',
  title: 'Robotics builder challenge', summary: 'Applications open. Hardware kit and cash prize. Deadline October 12, 2026.',
  publishedAt: null, observedAt: '2026-08-30T10:00:00Z', contentHash: 'hash', changeKind: 'new',
  promotionStatus: 'pending', promotionReasons: [], suppressionReasons: [], preliminaryScore: 0,
}

describe('deterministic signal promotion', () => {
  it('promotes a strong, current opportunity without GPT', () => {
    const promoted = promoteSignal(signal, subscription)
    expect(promoted.promotionStatus).toBe('promoted')
    expect(promoted.preliminaryScore).toBeGreaterThan(70)
    expect(candidateFromSignal(promoted, subscription).sourcePackId).toBe('hardware-robotics')
  })

  it('suppresses an explicitly closed opportunity', () => {
    const closed = promoteSignal({ ...signal, summary: 'Applications closed. Winner announced.' }, subscription)
    expect(closed.promotionStatus).toBe('suppressed')
    expect(closed.suppressionReasons.join(' ')).toMatch(/closed|winner/i)
  })

  it('keeps a single weak keyword ambiguous', () => {
    const weak = promoteSignal({ ...signal, title: 'Community news', summary: 'A challenge for the community.' }, subscription)
    expect(weak.promotionStatus).toBe('ambiguous')
  })
})
