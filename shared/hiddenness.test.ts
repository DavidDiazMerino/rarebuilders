import { describe, expect, it } from 'vitest'
import { estimateHiddenness } from './hiddenness'

describe('observable Hiddenness', () => {
  it('scores a small community source above a mass-market aggregator', () => {
    const community = estimateHiddenness({
      sourceKind: 'community',
      sourceLabel: 'Local Discord',
      sourceUrl: 'https://example.org/call',
      region: 'europe',
      language: 'Spanish',
      participants: 35,
    })
    const aggregator = estimateHiddenness({
      sourceKind: 'official',
      sourceLabel: 'Devpost listing',
      sourceUrl: 'https://openai.devpost.com/',
      region: 'global',
      language: 'English',
      participants: 32_500,
    })

    expect(community.score).toBeGreaterThan(aggregator.score)
    expect(community.factors.some((factor) => factor.label === 'Discovery channel')).toBe(true)
  })

  it('does not reward unknown participant volume and lowers confidence', () => {
    const known = estimateHiddenness({
      sourceKind: 'newsletter',
      sourceLabel: 'Regional newsletter',
      sourceUrl: 'https://example.org/newsletter',
      region: 'europe',
      language: 'English',
      participants: 40,
    })
    const unknown = estimateHiddenness({
      sourceKind: 'newsletter',
      sourceLabel: 'Regional newsletter',
      sourceUrl: 'https://example.org/newsletter',
      region: 'europe',
      language: 'English',
      participants: null,
    })

    expect(unknown.score).toBeLessThan(known.score)
    expect(unknown.confidence).toBeLessThan(known.confidence)
  })
})
