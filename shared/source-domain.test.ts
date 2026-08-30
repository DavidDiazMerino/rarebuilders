import { describe, expect, it } from 'vitest'
import {
  rawSignalSchema,
  sourceCapabilitySchema,
  sourceSubscriptionSchema,
} from './domain'

describe('source intelligence contracts', () => {
  it('models a public twice-weekly subscription without a user profile', () => {
    const source = sourceSubscriptionSchema.parse({
      id: 'sports-soccernet',
      adapterId: 'page-monitor',
      sourcePackId: 'sports-vision',
      label: 'SoccerNet challenges',
      kind: 'page',
      scope: { type: 'global' },
      privacy: 'public',
      cadence: 'twice-weekly',
      endpoint: 'https://www.soccer-net.org/challenges',
      trust: 90,
    })
    expect(source.enabled).toBe(true)
    expect(source.scope).toEqual({ type: 'global' })
  })

  it('keeps raw observations separate from promotion decisions', () => {
    const signal = rawSignalSchema.parse({
      id: 'signal-1',
      subscriptionId: 'sports-soccernet',
      sourcePackId: 'sports-vision',
      adapterId: 'page-monitor',
      scope: { type: 'global' },
      privacy: 'public',
      externalId: 'challenge-page',
      canonicalUrl: 'https://www.soccer-net.org/challenges',
      title: 'New tracking challenge',
      summary: 'Applications open. Prize and submission deadline published.',
      publishedAt: null,
      observedAt: '2026-08-30T20:00:00.000Z',
      contentHash: 'abc123',
      changeKind: 'new',
      promotionStatus: 'pending',
      promotionReasons: [],
      suppressionReasons: [],
      preliminaryScore: 0,
    })
    expect(signal.promotionStatus).toBe('pending')
  })

  it('supports runtime capabilities without extending an enum', () => {
    expect(sourceCapabilitySchema.parse({
      id: 'future-adapter',
      label: 'Future adapter',
      group: 'monitor',
      collectorKinds: ['page'],
      configured: true,
      costClass: 'free',
      privacy: 'public',
    }).id).toBe('future-adapter')
  })
})
