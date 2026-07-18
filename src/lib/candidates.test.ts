import { describe, expect, it } from 'vitest'
import type { OpportunityCandidate } from '../../shared/domain'
import { demoProfile } from '../data/fixtures'
import {
  candidateId,
  candidatePreFit,
  candidatePreFitDetails,
  profileDiscoveryFocus,
  retainCandidateHistory,
} from './candidates'

const candidate: OpportunityCandidate = {
  id: 'candidate',
  connector: 'devpost',
  externalId: '1',
  canonicalUrl: 'https://example.com/challenge',
  title: 'AI agent developer tools challenge',
  organizer: 'Example',
  summary: 'Build an agent workflow with TypeScript.',
  deadline: null,
  reward: '$1,000',
  region: 'global',
  language: 'English',
  tags: ['ai-agents', 'developer-tools'],
  participationModes: ['individual'],
  discoveredAt: '2026-07-17T12:00:00Z',
  lastSeenAt: '2026-07-17T12:00:00Z',
  status: 'new',
}

describe('candidate preselection', () => {
  it('creates stable connector-scoped identifiers', () => {
    expect(candidateId('devpost', '123')).toBe(candidateId('devpost', '123'))
    expect(candidateId('github', '123')).not.toBe(candidateId('devpost', '123'))
  })

  it('ranks documented domain overlap above an unrelated candidate', () => {
    const unrelated = { ...candidate, title: 'Marine biology field prize', summary: 'Study coral ecosystems.', tags: ['biology'] }

    expect(candidatePreFit(demoProfile, candidate)).toBeGreaterThan(candidatePreFit(demoProfile, unrelated))
  })

  it('explains positive matches and penalizes an explicit no-go', () => {
    const matching = candidatePreFitDetails(demoProfile, candidate)
    const conflicted = candidatePreFitDetails({
      ...demoProfile,
      noGoDomains: ['developer-tools'],
    }, candidate)

    expect(matching.matches).toContain('AI agents')
    expect(conflicted.noGoMatches).toContain('developer-tools')
    expect(conflicted.score).toBeLessThan(matching.score)
  })

  it('does not treat any mention of the web as a generic-framework no-go', () => {
    const result = candidatePreFitDetails({
      ...demoProfile,
      noGoDomains: ['generic-web-frameworks'],
    }, {
      ...candidate,
      title: 'Computer vision benchmark for the web',
      summary: 'Evaluate pose estimation models in the browser.',
      tags: ['computer-vision'],
    })

    expect(result.noGoMatches).toEqual([])
  })

  it('derives a concise profile focus for daily discovery', () => {
    expect(profileDiscoveryFocus(demoProfile)).toBe('ai agents developer tools')
  })

  it('bounds fresh source history while preserving explicit decisions', () => {
    const history = Array.from({ length: 45 }, (_, index): OpportunityCandidate => ({
      ...candidate,
      id: `candidate-${index}`,
      externalId: String(index),
      lastSeenAt: new Date(Date.UTC(2026, 6, 17, 12, index)).toISOString(),
    }))
    history[0] = { ...history[0], status: 'added' }

    const retained = retainCandidateHistory(history)

    expect(retained.filter((item) => item.status === 'new')).toHaveLength(30)
    expect(retained.some((item) => item.id === 'candidate-0')).toBe(true)
  })
})
