import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import {
  opportunityAnalysisSchema,
  profileSummarySchema,
  strategySchema,
  type BuilderProfile,
  type Opportunity,
} from '../../shared/domain.js'
import { normalizeHundredScore } from './model-normalization.js'

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.6-luna'

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

function compactProfile(profile: BuilderProfile) {
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
    projects: profile.projects.map((project) => ({
      name: project.name,
      summary: project.summary,
      domains: project.domains,
      technologies: project.technologies,
      reusableAssets: project.reusableAssets,
    })),
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
              'sourceUrl must be a supplied public repository URL or null.',
            ].join('\n'),
          },
        ],
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text: JSON.stringify(input).slice(0, 100_000) }],
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
              'hiddennessBase and strategicValueBase are bounded heuristic signals, not probabilities.',
              'confidence represents confidence in extraction from this source.',
              'confidence, hiddennessBase and strategicValueBase must be integer scores from 0 to 100; never use decimals from 0 to 1.',
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
          text: JSON.stringify({
            sourceUrl: input.sourceUrl,
            sourceText: input.sourceText.slice(0, 30_000),
            builderContext: compactProfile(input.profile),
          }).slice(0, 60_000),
        }],
      },
    ],
    text: { format: zodTextFormat(opportunityAnalysisSchema, 'opportunity_analysis') },
  })
  if (!response.output_parsed) throw new Error('GPT-5.6 did not return a usable opportunity record.')
  return opportunityAnalysisSchema.parse({
    ...response.output_parsed,
    hiddennessBase: normalizeHundredScore(response.output_parsed.hiddennessBase),
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
          text: JSON.stringify({
            opportunity: input.opportunity,
            builderContext: compactProfile(input.profile),
          }).slice(0, 60_000),
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
