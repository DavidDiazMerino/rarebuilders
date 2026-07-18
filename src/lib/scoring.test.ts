import { describe, expect, it } from 'vitest'
import type { BuilderProfile, FeedbackEvent, Opportunity } from '../../shared/domain'
import { demoOpportunities, demoProfile } from '../data/fixtures'
import {
  buildRadar,
  evaluateOpportunity,
  learnedDomainWeightsFromFeedback,
} from './scoring'

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
    expect(radar.every((item) => item.bucketMatch === 'exact' || item.bucketMatch === 'closest')).toBe(true)
    expect(new Set(radar.map((item) => item.opportunity.id)).size).toBe(5)
  })

  it('discloses when a bucket is filled with the closest available item', () => {
    const conventionalProfile = {
      ...demoProfile,
      wildcardDomains: [],
    }
    const conventional = demoOpportunities.slice(0, 5).map((opportunity, index) => ({
      ...opportunity,
      id: `conventional-${index}`,
      sourceKind: 'official' as const,
      sourceLabel: 'Official listing',
      sourceUrl: `https://example.org/opportunity/${index}`,
      region: 'global',
      language: 'English',
      participants: 2_500,
    }))

    const radar = buildRadar(conventionalProfile, conventional)
    const wildcard = radar.find((item) => item.bucket === 'wildcard')

    expect(wildcard?.bucketMatch).toBe('closest')
    expect(radar.some((item) => item.bucketMatch === 'closest')).toBe(true)
  })

  it('removes passed opportunities and learns bounded domain preferences separately', () => {
    const target = demoOpportunities[0]
    const decision: FeedbackEvent = {
      id: 'feedback-1',
      opportunityId: target.id,
      kind: 'decision',
      action: 'passed',
      reasonCode: 'time',
      domains: target.domains,
      createdAt: '2026-07-17T12:00:00.000Z',
    }
    const preferences = Array.from({ length: 8 }, (_, index): FeedbackEvent => ({
      id: `preference-${index}`,
      opportunityId: `opportunity-${index}`,
      kind: 'preference',
      action: 'less-like',
      domains: ['AI'],
      createdAt: `2026-07-17T12:0${index}:00.000Z`,
    }))
    const radar = buildRadar(demoProfile, demoOpportunities, [decision])
    const learned = learnedDomainWeightsFromFeedback(preferences)

    expect(radar.some((item) => item.opportunity.id === target.id)).toBe(false)
    expect(learned.ai).toBe(-20)
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

  it('uses reviewed CV evidence and penalizes unavailable participation paths', () => {
    const opportunity: Opportunity = {
      ...demoOpportunities[0],
      domains: ['unfamiliar-domain'],
      requiredSkills: ['Rust'],
      participationModes: ['company'],
      applicationBurden: 'high',
    }
    const withEvidence = {
      ...demoProfile,
      careerProfile: {
        ...demoProfile.careerProfile,
        skills: [{ name: 'Rust', evidence: ['Shipped a Rust service'], confidence: 95 }],
      },
      participationModes: ['individual'] as BuilderProfile['participationModes'],
    }
    const withoutEvidence = {
      ...withEvidence,
      careerProfile: { ...withEvidence.careerProfile, skills: [] },
    }

    const evidenced = evaluateOpportunity(withEvidence, opportunity)
    const undocumented = evaluateOpportunity(withoutEvidence, opportunity)

    expect(evidenced.fit).toBeGreaterThan(undocumented.fit)
    expect(evidenced.risk).toBeGreaterThan(20)
    expect(evidenced.reasonsAgainst.join(' ')).toMatch(/company/)
  })

  it('does not interpret an unknown zero effort as free work', () => {
    const opportunity: Opportunity = {
      ...demoOpportunities[0],
      effortHours: 0,
      unknowns: ['Effort estimate is unavailable from the source.'],
    }

    const evaluation = evaluateOpportunity(demoProfile, opportunity)

    expect(evaluation.effortFit).toBe(45)
    expect(evaluation.verificationStatus).toBe('needs-review')
    expect(evaluation.riskFactors).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Unknown effort', impact: 14 }),
    ]))
    expect(evaluation.reasonsAgainst.join(' ')).toMatch(/Effort is unknown/)
  })

  it('canonicalizes equivalent domain labels into one learned signal', () => {
    const feedback: FeedbackEvent[] = [
      {
        id: 'one',
        opportunityId: 'one',
        kind: 'preference',
        action: 'more-like',
        domains: ['AI Agents'],
        createdAt: '2026-07-18T10:00:00Z',
      },
      {
        id: 'two',
        opportunityId: 'two',
        kind: 'decision',
        action: 'saved',
        domains: ['ai-agents'],
        createdAt: '2026-07-18T10:01:00Z',
      },
    ]

    expect(learnedDomainWeightsFromFeedback(feedback)).toEqual({ 'ai-agents': 5 })
  })

  it('uses only the latest decision per opportunity', () => {
    const initial: FeedbackEvent = {
      id: 'initial',
      opportunityId: 'same-opportunity',
      kind: 'preference',
      action: 'more-like',
      domains: ['AI Agents'],
      createdAt: '2026-07-18T10:00:00Z',
    }
    const replacement: FeedbackEvent = {
      ...initial,
      id: 'replacement',
      action: 'less-like',
      domains: ['ai-agents'],
      createdAt: '2026-07-18T10:01:00Z',
    }

    expect(learnedDomainWeightsFromFeedback([initial, replacement])).toEqual({ 'ai-agents': -5 })
    const learnedWithHistory = learnedDomainWeightsFromFeedback([initial, replacement])
    const learnedWithReplacement = learnedDomainWeightsFromFeedback([replacement])

    expect(learnedWithHistory).toEqual(learnedWithReplacement)
    expect(
      evaluateOpportunity(
        { ...demoProfile, learnedDomainWeights: learnedWithHistory },
        demoOpportunities[1],
      ).overall,
    ).toBe(evaluateOpportunity(
      { ...demoProfile, learnedDomainWeights: learnedWithReplacement },
      demoOpportunities[1],
    ).overall)
  })
})
