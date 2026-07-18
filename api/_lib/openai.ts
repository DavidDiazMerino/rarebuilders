import OpenAI from 'openai'
import { randomUUID } from 'node:crypto'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import {
  opportunityAnalysisSchema,
  careerProfileSchema,
  profileSummarySchema,
  strategySchema,
  type BuilderProfile,
  type Opportunity,
} from '../../shared/domain.js'
import { estimateHiddenness } from '../../shared/hiddenness.js'
import { normalizeHundredScore } from './model-normalization.js'

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.6-luna'
const PROMPT_VERSION = {
  builderMemory: 'builder-memory-v3',
  opportunity: 'opportunity-analysis-v4',
  strategy: 'participation-strategy-v2',
} as const

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('Live GPT-5.6 analysis is not configured yet.')
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const modelProfileSummarySchema = profileSummarySchema.extend({
  projects: z.array(z.object({
    name: z.string(),
    summary: z.string(),
    domains: z.array(z.string()),
    technologies: z.array(z.string()),
    status: z.enum(['idea', 'prototype', 'active', 'shipped', 'archived']),
    reusableAssets: z.array(z.string()),
    sourceLabel: z.string(),
    sourceUrl: z.string().nullable(),
  })),
})

const modelStrategySchema = strategySchema.omit({ model: true, generatedAt: true })
const modelOpportunityAnalysisSchema = opportunityAnalysisSchema.omit({ hiddennessBase: true })
const modelCareerProfileSchema = careerProfileSchema.extend({
  experiences: z.array(careerProfileSchema.shape.experiences.element.omit({ id: true })),
  education: z.array(careerProfileSchema.shape.education.element.omit({ id: true })),
})

function modelCareerContext(profile: BuilderProfile) {
  return {
    headline: profile.careerProfile.headline,
    summary: profile.careerProfile.summary,
    skills: profile.careerProfile.skills,
    experiences: profile.careerProfile.experiences.map(({ id: _id, ...experience }) => experience),
    achievements: profile.careerProfile.achievements,
    education: profile.careerProfile.education.map(({ id: _id, ...education }) => education),
  }
}

export function modelBuilderContext(profile: BuilderProfile) {
  return {
    name: profile.name,
    domains: profile.domains,
    wildcardDomains: profile.wildcardDomains,
    noGoDomains: profile.noGoDomains,
    fastSkills: profile.fastSkills,
    technologiesToExplore: profile.technologiesToExplore,
    rewardPreference: profile.rewardPreference,
    weeklyHours: profile.weeklyHours,
    regions: profile.regions,
    languages: profile.languages,
    teamMode: profile.teamMode,
    participationModes: profile.participationModes,
    career: modelCareerContext(profile),
    projects: profile.projects.map((project) => ({
      name: project.name,
      summary: project.summary,
      domains: project.domains,
      technologies: project.technologies,
      reusableAssets: project.reusableAssets,
    })),
  }
}

function modelOpportunityContext(opportunity: Opportunity) {
  const {
    id: _id,
    candidateId: _candidateId,
    discoveredAt: _discoveredAt,
    verifiedAt: _verifiedAt,
    fixture: _fixture,
    ...context
  } = opportunity
  return {
    ...context,
    hiddennessBase: estimateHiddenness(opportunity).score,
  }
}

export function builderMemoryCacheInput(input: Parameters<typeof summarizeBuilderMemory>[0]) {
  return {
    model: MODEL,
    promptVersion: PROMPT_VERSION.builderMemory,
    inputText: JSON.stringify(input).slice(0, 100_000),
  }
}

export function opportunityAnalysisCacheInput(input: Parameters<typeof analyzeOpportunitySource>[0]) {
  return {
    model: MODEL,
    promptVersion: PROMPT_VERSION.opportunity,
    inputText: JSON.stringify({
      sourceUrl: input.sourceUrl,
      sourceText: input.sourceText.slice(0, 30_000),
      builderContext: modelBuilderContext(input.profile),
    }).slice(0, 60_000),
  }
}

export function opportunityStrategyCacheInput(input: Parameters<typeof generateOpportunityStrategy>[0]) {
  return {
    model: MODEL,
    promptVersion: PROMPT_VERSION.strategy,
    inputText: JSON.stringify({
      opportunity: modelOpportunityContext(input.opportunity),
      builderContext: modelBuilderContext(input.profile),
    }).slice(0, 60_000),
  }
}

export async function summarizeBuilderMemory(input: {
  notes: Array<{ name: string; content: string }>
  repositories: Array<{
    name: string
    url: string
    description: string
    languages: string[]
    topics: string[]
    readme: string
  }>
}) {
  const response = await client().responses.parse({
    model: MODEL,
    reasoning: { effort: 'low' },
    max_output_tokens: 1800,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You build a factual, editable inventory of a software builder.',
              'Use only the supplied notes and public repository context.',
              'Do not infer employers, identity, private facts, success, revenue, or production status.',
              'Merge duplicate references to the same project.',
              'Keep summaries specific and concise. Record caveats when evidence is thin.',
              'Extract positive technical interests as concise domains, not only completed project domains.',
              'Use wildcardDomains only for topics the builder explicitly describes as exploratory or a deliberate stretch.',
              'Use noGoDomains only for topics the builder explicitly rejects or says are not useful; do not infer dislikes.',
              'Preserve useful distinctions such as AI developer tools, model evaluation, safety, computer vision and sports analytics.',
              'sourceUrl must be a supplied public repository URL or null.',
            ].join('\n'),
          },
        ],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: builderMemoryCacheInput(input).inputText }],
      },
    ],
    text: { format: zodTextFormat(modelProfileSummarySchema, 'builder_memory') },
  })
  if (!response.output_parsed) throw new Error('GPT-5.6 did not return a usable builder-memory record.')
  return profileSummarySchema.parse({
    ...response.output_parsed,
    projects: response.output_parsed.projects.map((project) => ({
      ...project,
      sourceUrl: project.sourceUrl ?? undefined,
    })),
  })
}

export async function analyzeCareerDocument(input: {
  filename: string
  mimeType: string
  base64: string
}) {
  const fileData = `data:${input.mimeType};base64,${input.base64}`
  const response = await client().responses.parse({
    model: MODEL,
    store: false,
    reasoning: { effort: 'low' },
    max_output_tokens: 2200,
    input: [{
      role: 'user',
      content: [
        {
          type: 'input_file',
          filename: input.filename,
          file_data: fileData,
        },
        {
          type: 'input_text',
          text: [
            'Build an editable, factual career profile from this CV.',
            'Return only claims supported by the document.',
            'Do not infer seniority, skill level, identity traits, salary, employers, dates or years of experience.',
            'Each skill needs short evidence and a confidence score for extraction quality, not proficiency.',
            'Keep achievements and summaries concise. Empty fields are preferable to invented content.',
          ].join('\n'),
        },
      ],
    }],
    text: { format: zodTextFormat(modelCareerProfileSchema, 'career_profile') },
  })
  if (!response.output_parsed) throw new Error('GPT-5.6 did not return a usable career profile.')
  return careerProfileSchema.parse({
    ...response.output_parsed,
    experiences: response.output_parsed.experiences.map((experience) => ({ ...experience, id: randomUUID() })),
    education: response.output_parsed.education.map((education) => ({ ...education, id: randomUUID() })),
  })
}

export async function analyzeOpportunitySource(input: {
  sourceUrl: string
  sourceText: string
  profile: BuilderProfile
}) {
  const response = await client().responses.parse({
    model: MODEL,
    reasoning: { effort: 'low' },
    max_output_tokens: 2200,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You normalize one opportunity source for a decision-support product.',
              'Use only the supplied source. Never fabricate organizer, deadline, reward, eligibility or participant counts.',
              'Use null for an unknown deadline/timezone/participants and list material unknowns.',
              'Evidence values must be concise paraphrases, not long quotes.',
              'Mark every evidence item fact or inference.',
              'strategicValueBase is a bounded heuristic signal, not a probability.',
              'confidence represents confidence in extraction from this source.',
              'confidence and strategicValueBase must be integer scores from 0 to 100; never use decimals from 0 to 1.',
              'Use ISO 8601 with an explicit offset for deadlines when the source provides enough information.',
              'sourceUrl must exactly equal the supplied source URL, including an empty string for pasted-only evidence.',
            ].join('\n'),
          },
        ],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: opportunityAnalysisCacheInput(input).inputText,
        }],
      },
    ],
    text: { format: zodTextFormat(modelOpportunityAnalysisSchema, 'opportunity_analysis') },
  })
  if (!response.output_parsed) throw new Error('GPT-5.6 did not return a usable opportunity record.')
  const hiddenness = estimateHiddenness(response.output_parsed)
  return opportunityAnalysisSchema.parse({
    ...response.output_parsed,
    hiddennessBase: hiddenness.score,
    strategicValueBase: normalizeHundredScore(response.output_parsed.strategicValueBase),
    confidence: normalizeHundredScore(response.output_parsed.confidence),
  })
}

export async function generateOpportunityStrategy(input: {
  opportunity: Opportunity
  profile: BuilderProfile
}) {
  const response = await client().responses.parse({
    model: MODEL,
    reasoning: { effort: 'low' },
    max_output_tokens: 1500,
    input: [
      {
        role: 'system',
        content: [{
          type: 'input_text',
          text: [
            'You are the strategy layer of RareBuilders.',
            'Create a specific, honest participation strategy using only the supplied opportunity and builder context.',
            'Prefer reuse over greenfield work. Mention hard risks. Do not imply eligibility has been verified.',
            'Return exactly three concrete first steps.',
          ].join('\n'),
        }],
      },
      {
        role: 'user',
        content: [{
          type: 'input_text',
          text: opportunityStrategyCacheInput(input).inputText,
        }],
      },
    ],
    text: { format: zodTextFormat(modelStrategySchema, 'participation_strategy') },
  })
  if (!response.output_parsed) throw new Error('GPT-5.6 did not return a usable strategy.')
  return strategySchema.parse({
    ...response.output_parsed,
    model: `${MODEL} · live`,
    generatedAt: new Date().toISOString(),
  })
}

export { MODEL }
