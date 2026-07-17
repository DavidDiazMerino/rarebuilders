import { describe, expect, it } from 'vitest'
import type { BuilderProfile, FeedbackEvent } from '../../shared/domain'
import { demoOpportunities, demoProfile } from '../data/fixtures'
import { applyFeedbackLearning, buildRadar, evaluateOpportunity } from './scoring'

describe('opportunity scoring', () => {
  it('keeps the six signals bounded and explains the decision', () => {
    const evaluation = evaluateOpportunity(demoProfile, demoOpportunities[0])

    for (const score of [
      evaluation.fit,
      evaluation.winSignal,
      evaluation.hiddenness,
      evaluation.strategicValue,
      evaluation.effortFit,
      evaluation.risk,
      evaluation.overall,
    ]) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
    expect(evaluation.reasonsFor).toHaveLength(3)
    expect(evaluation.reasonsAgainst).toHaveLength(3)
    expect(evaluation.matchedProjectIds.length).toBeGreaterThan(0)
  })

  it('builds a deliberately finite 2 practical, 2 rare, 1 wildcard radar', () => {
    const radar = buildRadar(demoProfile, demoOpportunities)

    expect(radar).toHaveLength(5)
    expect(radar.filter((item) => item.bucket === 'practical')).toHaveLength(2)
    expect(radar.filter((item) => item.bucket === 'rare')).toHaveLength(2)
    expect(radar.filter((item) => item.bucket === 'wildcard')).toHaveLength(1)
    expect(new Set(radar.map((item) => item.opportunity.id)).size).toBe(5)
  })

  it('removes rejected opportunities and learns bounded domain preferences', () => {
    const target = demoOpportunities[0]
    const rejection: FeedbackEvent = {
      id: 'feedback-1',
      opportunityId: target.id,
      action: 'rejected',
      domains: target.domains,
      createdAt: '2026-07-17T12:00:00.000Z',
    }

    const radar = buildRadar(demoProfile, demoOpportunities, [rejection])
    const learned = Array.from({ length: 8 }).reduce<BuilderProfile>(
      (profile) => applyFeedbackLearning(profile, rejection),
      demoProfile,
    )

    expect(radar.some((item) => item.opportunity.id === target.id)).toBe(false)
    expect(learned.learnedDomainWeights.ai).toBe(-20)
  })

  it('respects explicit no-go domains and declared constraints', () => {
    const blockedProfile = {
      ...demoProfile,
      noGoDomains: ['publishing'],
      rewardPreference: 'money' as const,
    }
    const radar = buildRadar(blockedProfile, demoOpportunities)

    expect(radar.some((item) => item.opportunity.domains.includes('publishing'))).toBe(false)
    expect(
      evaluateOpportunity(blockedProfile, demoOpportunities[4]).fit,
    ).toBeLessThan(evaluateOpportunity(demoProfile, demoOpportunities[4]).fit)
  })
})
