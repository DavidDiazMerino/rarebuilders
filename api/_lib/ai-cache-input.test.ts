import { describe, expect, it } from 'vitest'
import { demoOpportunities, demoProfile } from '../../src/data/fixtures'
import { contentHash } from './cache'
import {
  modelBuilderContext,
  opportunityAnalysisCacheInput,
  opportunityStrategyCacheInput,
} from './openai'

const analysisInput = {
  sourceUrl: 'https://example.com/call',
  sourceText: 'A sufficiently detailed opportunity source with eligibility, requirements, reward and deadline.',
  profile: demoProfile,
}

describe('AI cache identity', () => {
  it('ignores feedback-only profile state that is not sent to the model', () => {
    const learnedProfile = {
      ...demoProfile,
      learnedDomainWeights: { 'ai-agents': 15 },
    }

    expect(modelBuilderContext(learnedProfile)).toEqual(modelBuilderContext(demoProfile))
    expect(contentHash(opportunityAnalysisCacheInput({
      ...analysisInput,
      profile: learnedProfile,
    }))).toBe(contentHash(opportunityAnalysisCacheInput(analysisInput)))
  })

  it('invalidates analysis when model-visible builder context changes', () => {
    const changedProfile = { ...demoProfile, weeklyHours: demoProfile.weeklyHours + 1 }

    expect(contentHash(opportunityAnalysisCacheInput({
      ...analysisInput,
      profile: changedProfile,
    }))).not.toBe(contentHash(opportunityAnalysisCacheInput(analysisInput)))
  })

  it('ignores persistence-only opportunity identity in strategy requests', () => {
    const first = opportunityStrategyCacheInput({
      opportunity: demoOpportunities[0],
      profile: demoProfile,
    })
    const second = opportunityStrategyCacheInput({
      opportunity: {
        ...demoOpportunities[0],
        id: 'another-local-id',
        discoveredAt: '2030-01-01T00:00:00Z',
        verifiedAt: '2030-01-02T00:00:00Z',
      },
      profile: { ...demoProfile, learnedDomainWeights: { ai: -10 } },
    })

    expect(contentHash(first)).toBe(contentHash(second))
  })
})
