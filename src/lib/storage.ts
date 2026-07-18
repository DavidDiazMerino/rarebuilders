import {
  appSettingsSchema,
  builderProfileSchema,
  feedbackEventSchema,
  opportunityCandidateSchema,
  opportunitySchema,
  strategySchema,
  type AppData,
  type BuilderProfile,
} from '../../shared/domain'
import { demoOpportunities, demoProfile, demoStrategies } from '../data/fixtures'
import { retainCandidateHistory } from './candidates'
import {
  canonicalLearnedDomainWeights,
  learnedDomainWeightsFromFeedback,
} from './scoring'

export const STORAGE_KEY = 'rarebuilders:v1'

export const initialAppData = (): AppData => ({
  version: 2,
  profile: structuredClone(demoProfile),
  opportunities: structuredClone(demoOpportunities),
  candidates: [],
  feedback: [],
  strategies: structuredClone(demoStrategies),
  settings: { autoAnalysisBudget: 0 },
  connectorRefresh: {},
  mode: null,
})

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return initialAppData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialAppData()
    const parsed = JSON.parse(raw) as Omit<Partial<AppData>, 'version'> & { version?: number }
    if (parsed.version !== 1 && parsed.version !== 2) return initialAppData()
    const profile = builderProfileSchema.parse(parsed.profile)
    const opportunities = validatedItems(parsed.opportunities, opportunitySchema)
    const feedback = validatedItems(parsed.feedback, feedbackEventSchema)
    const strategies = Object.fromEntries(
      Object.entries(parsed.strategies ?? {}).flatMap(([key, value]) => {
        const result = strategySchema.safeParse(value)
        return result.success ? [[key, result.data]] : []
      }),
    )
    const connectorRefresh = Object.fromEntries(
      Object.entries(parsed.connectorRefresh ?? {}).filter(([, value]) => typeof value === 'string'),
    )
    const settings = appSettingsSchema.safeParse(parsed.settings)
    return {
      version: 2,
      profile: {
        ...profile,
        learnedDomainWeights: feedback.length
          ? learnedDomainWeightsFromFeedback(feedback)
          : canonicalLearnedDomainWeights(profile.learnedDomainWeights),
      },
      opportunities: opportunities.length ? opportunities : structuredClone(demoOpportunities),
      candidates: retainCandidateHistory(validatedItems(parsed.candidates, opportunityCandidateSchema)),
      feedback,
      strategies,
      settings: settings.success ? settings.data : { autoAnalysisBudget: 0 },
      connectorRefresh,
      mode: parsed.mode === 'demo' || parsed.mode === 'personal' ? parsed.mode : null,
    }
  } catch {
    return initialAppData()
  }
}

function validatedItems<T>(
  value: unknown,
  schema: { safeParse: (item: unknown) => { success: true; data: T } | { success: false } },
) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const result = schema.safeParse(item)
    return result.success ? [result.data] : []
  })
}

export function saveAppData(data: AppData) {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function emptyPersonalProfile(): BuilderProfile {
  return {
    ...structuredClone(demoProfile),
    id: crypto.randomUUID(),
    name: 'Builder',
    domains: [],
    wildcardDomains: [],
    noGoDomains: [],
    fastSkills: [],
    technologiesToExplore: [],
    rewardPreference: 'money',
    weeklyHours: 10,
    regions: ['global'],
    languages: ['English'],
    teamMode: 'either',
    participationModes: ['individual', 'team'],
    projects: [],
    connectedGithubRepositories: [],
    careerProfile: {
      headline: '',
      summary: '',
      skills: [],
      experiences: [],
      achievements: [],
      education: [],
    },
    learnedDomainWeights: {},
    onboardingComplete: false,
  }
}
