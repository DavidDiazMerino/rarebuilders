import { builderProfileSchema, opportunitySchema, type AppData } from '../../shared/domain'
import { demoOpportunities, demoProfile, demoStrategies } from '../data/fixtures'

export const STORAGE_KEY = 'rarebuilders:v1'

export const initialAppData = (): AppData => ({
  version: 1,
  profile: structuredClone(demoProfile),
  opportunities: structuredClone(demoOpportunities),
  feedback: [],
  strategies: structuredClone(demoStrategies),
  mode: null,
})

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return initialAppData()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return initialAppData()
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (parsed.version !== 1) return initialAppData()
    const profile = builderProfileSchema.parse(parsed.profile)
    const opportunities = (parsed.opportunities ?? []).map((item) => opportunitySchema.parse(item))
    return {
      version: 1,
      profile,
      opportunities: opportunities.length ? opportunities : structuredClone(demoOpportunities),
      feedback: parsed.feedback ?? [],
      strategies: parsed.strategies ?? {},
      mode: parsed.mode ?? null,
    }
  } catch {
    return initialAppData()
  }
}

export function saveAppData(data: AppData) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function emptyPersonalProfile() {
  return {
    ...structuredClone(demoProfile),
    id: crypto.randomUUID(),
    name: 'Builder',
    projects: [],
    learnedDomainWeights: {},
    onboardingComplete: false,
  }
}
