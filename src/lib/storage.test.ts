import { describe, expect, it } from 'vitest'
import { emptyPersonalProfile, initialAppData, loadAppData, saveAppData, STORAGE_KEY } from './storage'

describe('local application storage', () => {
  it('round-trips validated application data', () => {
    const data = { ...initialAppData(), mode: 'demo' as const }
    saveAppData(data)

    const restored = loadAppData()
    expect(restored.mode).toBe('demo')
    expect(restored.profile.name).toBe('David')
    expect(restored.opportunities.length).toBeGreaterThanOrEqual(5)
  })

  it('recovers safely from invalid or incompatible data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"version":99,"profile":null}')

    const restored = loadAppData()
    expect(restored.version).toBe(2)
    expect(restored.mode).toBeNull()
    expect(restored.profile.name).toBe('David')
  })

  it('migrates profiles saved before connected GitHub sources were tracked', () => {
    const data = initialAppData()
    const {
      connectedGithubRepositories: _repositories,
      careerProfile: _career,
      participationModes: _modes,
      ...legacyProfile
    } = data.profile
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      version: 1,
      profile: legacyProfile,
      candidates: undefined,
      settings: undefined,
      connectorRefresh: undefined,
    }))

    const restored = loadAppData()

    expect(restored.profile.connectedGithubRepositories).toEqual([])
    expect(restored.profile.projects).toHaveLength(data.profile.projects.length)
    expect(restored.profile.careerProfile.skills).toEqual([])
    expect(restored.candidates).toEqual([])
  })

  it('keeps valid records when one stored item is corrupted', () => {
    const data = initialAppData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      mode: 'demo',
      candidates: [{ invalid: true }],
      feedback: [{ invalid: true }],
      strategies: { valid: data.strategies[data.opportunities[0].id], broken: { headline: 42 } },
    }))

    const restored = loadAppData()

    expect(restored.mode).toBe('demo')
    expect(restored.profile.name).toBe('David')
    expect(restored.candidates).toEqual([])
    expect(restored.feedback).toEqual([])
    expect(Object.values(restored.strategies)).toHaveLength(1)
  })

  it('starts a personal profile without inheriting the demo builder identity', () => {
    const profile = emptyPersonalProfile()

    expect(profile.domains).toEqual([])
    expect(profile.noGoDomains).toEqual([])
    expect(profile.projects).toEqual([])
    expect(profile.name).toBe('Builder')
  })

  it('migrates learned signals from the latest canonical feedback state', () => {
    const data = initialAppData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      profile: { ...data.profile, learnedDomainWeights: { 'AI Agents': 20 } },
      feedback: [
        {
          id: 'first',
          opportunityId: 'same',
          action: 'more-like-this',
          domains: ['AI Agents'],
          createdAt: '2026-07-18T10:00:00Z',
        },
        {
          id: 'latest',
          opportunityId: 'same',
          action: 'rejected',
          domains: ['ai-agents'],
          createdAt: '2026-07-18T10:01:00Z',
        },
      ],
    }))

    expect(loadAppData().profile.learnedDomainWeights).toEqual({ 'ai-agents': -5 })
  })
})
