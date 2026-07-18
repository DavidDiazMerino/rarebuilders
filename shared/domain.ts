import { z } from 'zod'

export const rewardPreferenceSchema = z.enum(['money', 'visibility', 'learning', 'access', 'portfolio'])
export type RewardPreference = z.infer<typeof rewardPreferenceSchema>

export const teamModeSchema = z.enum(['solo', 'team', 'either'])
export type TeamMode = z.infer<typeof teamModeSchema>

export const sourceKindSchema = z.enum(['official', 'github', 'newsletter', 'community', 'manual', 'demo'])
export type SourceKind = z.infer<typeof sourceKindSchema>

export const participationModeSchema = z.enum(['individual', 'team', 'company', 'consortium', 'unknown'])
export type ParticipationMode = z.infer<typeof participationModeSchema>

export const careerSkillSchema = z.object({
  name: z.string().min(1),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(100),
})
export type CareerSkill = z.infer<typeof careerSkillSchema>

export const careerExperienceSchema = z.object({
  id: z.string(),
  role: z.string().min(1),
  organization: z.string(),
  period: z.string(),
  summary: z.string(),
  domains: z.array(z.string()),
  skills: z.array(z.string()),
  achievements: z.array(z.string()),
})
export type CareerExperience = z.infer<typeof careerExperienceSchema>

export const careerEducationSchema = z.object({
  id: z.string(),
  qualification: z.string().min(1),
  institution: z.string(),
  period: z.string(),
})
export type CareerEducation = z.infer<typeof careerEducationSchema>

export const careerProfileSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  skills: z.array(careerSkillSchema),
  experiences: z.array(careerExperienceSchema),
  achievements: z.array(z.string()),
  education: z.array(careerEducationSchema),
})
export type CareerProfile = z.infer<typeof careerProfileSchema>

export const emptyCareerProfile = (): CareerProfile => ({
  headline: '',
  summary: '',
  skills: [],
  experiences: [],
  achievements: [],
  education: [],
})

export const projectAssetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  summary: z.string(),
  domains: z.array(z.string()),
  technologies: z.array(z.string()),
  status: z.enum(['idea', 'prototype', 'active', 'shipped', 'archived']),
  reusableAssets: z.array(z.string()),
  sourceLabel: z.string(),
  sourceUrl: z.string().optional(),
})
export type ProjectAsset = z.infer<typeof projectAssetSchema>

export const connectedGithubRepositorySchema = z.object({
  fullName: z.string(),
  url: z.string().url(),
  description: z.string(),
  language: z.string().nullable(),
  importedAt: z.string(),
})
export type ConnectedGithubRepository = z.infer<typeof connectedGithubRepositorySchema>

export const builderProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  domains: z.array(z.string()),
  wildcardDomains: z.array(z.string()),
  noGoDomains: z.array(z.string()),
  fastSkills: z.array(z.string()),
  technologiesToExplore: z.array(z.string()),
  rewardPreference: rewardPreferenceSchema,
  weeklyHours: z.number().min(1).max(80),
  regions: z.array(z.string()),
  languages: z.array(z.string()),
  teamMode: teamModeSchema,
  participationModes: z.array(participationModeSchema).default(['individual', 'team']),
  projects: z.array(projectAssetSchema),
  connectedGithubRepositories: z.array(connectedGithubRepositorySchema).default([]),
  careerProfile: careerProfileSchema.default(emptyCareerProfile),
  learnedDomainWeights: z.record(z.string(), z.number()),
  onboardingComplete: z.boolean(),
})
export type BuilderProfile = z.infer<typeof builderProfileSchema>

export const evidenceSchema = z.object({
  label: z.string(),
  value: z.string(),
  kind: z.enum(['fact', 'inference']),
})
export type Evidence = z.infer<typeof evidenceSchema>

export const opportunitySchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  organizer: z.string(),
  sourceLabel: z.string(),
  sourceUrl: z.string(),
  sourceKind: sourceKindSchema,
  candidateId: z.string().optional(),
  discoveredAt: z.string(),
  verifiedAt: z.string(),
  region: z.string(),
  language: z.string(),
  deadline: z.string().nullable(),
  timezone: z.string().nullable(),
  reward: z.string(),
  participants: z.number().nullable(),
  eligibility: z.array(z.string()),
  requirements: z.array(z.string()),
  deliverables: z.array(z.string()),
  requiredSkills: z.array(z.string()).default([]),
  participationModes: z.array(participationModeSchema).default(['unknown']),
  entityRequirements: z.array(z.string()).default([]),
  applicationBurden: z.enum(['low', 'medium', 'high', 'unknown']).default('unknown'),
  domains: z.array(z.string()),
  effortHours: z.number().min(0).max(1000),
  hiddennessBase: z.number().min(0).max(100),
  strategicValueBase: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  unknowns: z.array(z.string()),
  evidence: z.array(evidenceSchema),
  summary: z.string(),
  fixture: z.boolean(),
})
export type Opportunity = z.infer<typeof opportunitySchema>

export const verdictSchema = z.enum(['enter', 'investigate', 'monitor', 'recycle', 'ignore'])
export type Verdict = z.infer<typeof verdictSchema>

export const hiddennessFactorSchema = z.object({
  label: z.string(),
  impact: z.number().min(-100).max(100),
  evidence: z.string(),
})

export const evaluationSchema = z.object({
  opportunityId: z.string(),
  fit: z.number().min(0).max(100),
  winSignal: z.number().min(0).max(100),
  hiddenness: z.number().min(0).max(100),
  hiddennessConfidence: z.number().min(0).max(100),
  hiddennessFactors: z.array(hiddennessFactorSchema),
  strategicValue: z.number().min(0).max(100),
  effortFit: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  verdict: verdictSchema,
  reasonsFor: z.array(z.string()),
  reasonsAgainst: z.array(z.string()),
  matchedProjectIds: z.array(z.string()),
})
export type OpportunityEvaluation = z.infer<typeof evaluationSchema>

export const feedbackActionSchema = z.enum(['saved', 'rejected', 'more-like-this', 'entered', 'ignored'])
export type FeedbackAction = z.infer<typeof feedbackActionSchema>

export const feedbackEventSchema = z.object({
  id: z.string(),
  opportunityId: z.string(),
  action: feedbackActionSchema,
  reason: z.string().optional(),
  domains: z.array(z.string()),
  createdAt: z.string(),
})
export type FeedbackEvent = z.infer<typeof feedbackEventSchema>

export const automatedConnectorIds = ['github', 'devpost', 'eu', 'kaggle'] as const
export type AutomatedConnectorId = typeof automatedConnectorIds[number]

export const connectorIdSchema = z.enum(['manual', ...automatedConnectorIds])
export type ConnectorId = z.infer<typeof connectorIdSchema>

export const candidateStatusSchema = z.enum(['new', 'inspected', 'added', 'dismissed'])
export type CandidateStatus = z.infer<typeof candidateStatusSchema>

export const opportunityCandidateSchema = z.object({
  id: z.string(),
  connector: connectorIdSchema,
  externalId: z.string(),
  canonicalUrl: z.string().url().optional(),
  title: z.string().min(1),
  organizer: z.string(),
  summary: z.string(),
  deadline: z.string().nullable(),
  reward: z.string(),
  region: z.string(),
  language: z.string(),
  tags: z.array(z.string()),
  participationModes: z.array(participationModeSchema).default(['unknown']),
  sourceText: z.string().max(12_000).optional(),
  discoveredAt: z.string(),
  lastSeenAt: z.string(),
  status: candidateStatusSchema,
  opportunityId: z.string().optional(),
})
export type OpportunityCandidate = z.infer<typeof opportunityCandidateSchema>

export const appSettingsSchema = z.object({
  autoAnalysisBudget: z.union([z.literal(0), z.literal(2), z.literal(5)]).default(0),
}).default({ autoAnalysisBudget: 0 })
export type AppSettings = z.infer<typeof appSettingsSchema>

export const strategySchema = z.object({
  headline: z.string(),
  angle: z.string(),
  whyNow: z.string(),
  leverage: z.array(z.string()),
  risks: z.array(z.string()),
  firstSteps: z.array(z.string()).min(3).max(3),
  model: z.string(),
  generatedAt: z.string(),
})
export type Strategy = z.infer<typeof strategySchema>

export const radarBucketSchema = z.enum(['practical', 'rare', 'wildcard'])
export type RadarBucket = z.infer<typeof radarBucketSchema>
export const radarBucketMatchSchema = z.enum(['exact', 'closest'])
export type RadarBucketMatch = z.infer<typeof radarBucketMatchSchema>

export type RadarItem = {
  opportunity: Opportunity
  evaluation: OpportunityEvaluation
  bucket: RadarBucket
  bucketMatch: RadarBucketMatch
}

export const importedProjectDraftSchema = projectAssetSchema.omit({ id: true }).extend({
  id: z.string().optional(),
})

export const profileSummarySchema = z.object({
  projects: z.array(importedProjectDraftSchema),
  fastSkills: z.array(z.string()),
  domains: z.array(z.string()),
  wildcardDomains: z.array(z.string()),
  noGoDomains: z.array(z.string()),
  technologies: z.array(z.string()),
  caveats: z.array(z.string()),
})
export type ProfileSummary = z.infer<typeof profileSummarySchema>

export const opportunityAnalysisSchema = opportunitySchema.omit({
  id: true,
  candidateId: true,
  discoveredAt: true,
  verifiedAt: true,
  fixture: true,
})
export type OpportunityAnalysis = z.infer<typeof opportunityAnalysisSchema>

export type AppData = {
  version: 2
  profile: BuilderProfile
  opportunities: Opportunity[]
  candidates: OpportunityCandidate[]
  feedback: FeedbackEvent[]
  strategies: Record<string, Strategy>
  settings: AppSettings
  connectorRefresh: Partial<Record<ConnectorId, string>>
  mode: 'demo' | 'personal' | null
}

export type ApiMeta = {
  cached: boolean
  requestId: string
  model?: string
}

export type ApiSuccess<T> = {
  data: T
  meta: ApiMeta
}

export type ApiFailure = {
  error: {
    code: string
    message: string
    requestId: string
  }
}
