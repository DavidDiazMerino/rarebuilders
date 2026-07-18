import {
  appSettingsSchema,
  builderProfileSchema,
  connectorStateSchema,
  feedbackEventSchema,
  opportunityCandidateSchema,
  opportunitySchema,
  strategySchema,
  type AppData,
  type BuilderProfile,
} from '../../shared/domain'
import {
  demoOpportunities,
  demoProfile,
  demoStrategies,
  personalSampleOpportunities,
} from '../data/fixtures'
import { retainCandidateHistory } from './candidates'
import {
  canonicalLearnedDomainWeights,
  learnedConstraintWeightsFromFeedback,
  learnedDomainWeightsFromFeedback,
} from './scoring'

export const STORAGE_KEY = 'rarebuilders:v1'

export const demoAppData = (): AppData => ({
  version: 3,
  profile: structuredClone(demoProfile),
  opportunities: structuredClone(demoOpportunities),
  candidates: [],
  feedback: [],
  strategies: structuredClone(demoStrategies),
  settings: { autoAnalysisBudget: 0 },
  connectorState: {},
  mode: null,
})

export const personalAppData = (): AppData => ({
  version: 3,
  profile: emptyPersonalProfile(),
  opportunities: structuredClone(personalSampleOpportunities),
  candidates: [],
  feedback: [],
  strategies: {},
  settings: { autoAnalysisBudget: 0 },
  connectorState: {},
  mode: 'personal',
})

export const initialAppData = demoAppData

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return initialAppData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialAppData()
    const parsed = JSON.parse(raw) as Omit<Partial<AppData>, 'version'> & { version?: number }
    if (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) return initialAppData()
    const profile = builderProfileSchema.parse({
      ...(parsed.profile as object),
      learnedConstraintWeights: (parsed.profile as BuilderProfile | undefined)?.learnedConstraintWeights ?? {},
    })
    const mode = parsed.mode === 'demo' || parsed.mode === 'personal' ? parsed.mode : null
    const storedOpportunities = validatedItems(
      Array.isArray(parsed.opportunities)
        ? parsed.opportunities.map(migrateOpportunity)
        : [],
      opportunitySchema,
    )
    const liveOpportunities = storedOpportunities.filter((opportunity) => opportunity.provenance.mode === 'live')
    const opportunities = mode === 'personal'
      ? [...liveOpportunities, ...structuredClone(personalSampleOpportunities)]
      : storedOpportunities
    const feedback = validatedItems(
      Array.isArray(parsed.feedback) ? parsed.feedback.map(migrateFeedback) : [],
      feedbackEventSchema,
    )
    const strategies = Object.fromEntries(
      Object.entries(parsed.strategies ?? {}).flatMap(([key, value]) => {
        const result = strategySchema.safeParse(value)
        return result.success ? [[key, result.data]] : []
      }),
    )
    const legacyRefresh = (parsed as { connectorRefresh?: Record<string, unknown> }).connectorRefresh ?? {}
    const connectorState = Object.fromEntries(
      Object.entries((parsed as Partial<AppData>).connectorState ?? {}).flatMap(([key, value]) => {
        const result = connectorStateSchema.safeParse(value)
        return result.success ? [[key, result.data]] : []
      }),
    )
    for (const [connector, refreshedAt] of Object.entries(legacyRefresh)) {
      if (typeof refreshedAt !== 'string' || connectorState[connector]) continue
      connectorState[connector] = {
        status: 'ready',
        lastAttemptAt: refreshedAt,
        lastSuccessAt: refreshedAt,
      }
    }
    const settings = appSettingsSchema.safeParse(parsed.settings)
    return {
      version: 3,
      profile: {
        ...profile,
        learnedDomainWeights: feedback.length
          ? learnedDomainWeightsFromFeedback(feedback)
          : canonicalLearnedDomainWeights(profile.learnedDomainWeights),
        learnedConstraintWeights: feedback.length
          ? learnedConstraintWeightsFromFeedback(feedback)
          : profile.learnedConstraintWeights,
      },
      opportunities: opportunities.length
        ? opportunities
        : mode === 'personal'
          ? structuredClone(personalSampleOpportunities)
          : structuredClone(demoOpportunities),
      candidates: retainCandidateHistory(validatedItems(parsed.candidates, opportunityCandidateSchema)),
      feedback,
      strategies,
      settings: settings.success ? settings.data : { autoAnalysisBudget: 0 },
      connectorState,
      mode,
    }
  } catch {
    return initialAppData()
  }
}

function migrateOpportunity(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const legacy = value as Record<string, unknown>
  if (legacy.provenance) return value
  const fixture = legacy.fixture === true
  const hasUrl = typeof legacy.sourceUrl === 'string' && /^https?:\/\//.test(legacy.sourceUrl)
  return {
    ...legacy,
    provenance: {
      mode: fixture ? 'illustrative' : 'live',
      evidenceRole: fixture ? 'reference-pattern' : hasUrl ? 'primary' : 'pasted',
      connector: legacy.candidateId && String(legacy.candidateId).startsWith('github-') ? 'github' : 'manual',
      method: fixture ? 'fixture' : hasUrl ? 'semantic-html' : 'plain-text',
      wordCount: null,
      warnings: fixture ? ['Migrated illustrative record; verify before deciding.'] : [],
    },
  }
}

function migrateFeedback(value: unknown) {
  if (!value || typeof value !== 'object') return value
  const legacy = value as Record<string, unknown>
  if (legacy.kind) return value
  const action = legacy.action
  const mapped = action === 'saved'
    ? { kind: 'decision', action: 'saved' }
    : action === 'entered'
      ? { kind: 'decision', action: 'entered' }
      : action === 'rejected' || action === 'ignored'
        ? { kind: 'decision', action: 'passed' }
        : action === 'more-like-this'
          ? { kind: 'preference', action: 'more-like' }
          : { kind: 'preference', action: 'clear' }
  return {
    ...legacy,
    ...mapped,
    reasonCode: action === 'rejected' ? 'domain-fit' : undefined,
    note: typeof legacy.reason === 'string' ? legacy.reason : undefined,
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
    learnedConstraintWeights: {},
    onboardingComplete: false,
  }
}
