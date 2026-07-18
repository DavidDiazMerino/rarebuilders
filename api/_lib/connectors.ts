import * as cheerio from 'cheerio'
import type {
  AutomatedConnectorId,
  OpportunityCandidate,
  ParticipationMode,
} from '../../shared/domain.js'
import { cachedResult } from './cache.js'
import { searchOpportunityIssues } from './github.js'
import { PublicError } from './http.js'

export type ConnectorSearchResult = {
  connector: AutomatedConnectorId
  candidates: OpportunityCandidate[]
  configured: boolean
  error?: string
}

const now = () => new Date().toISOString()

function idFor(connector: AutomatedConnectorId, externalId: string) {
  let hash = 2166136261
  const value = `${connector}:${externalId.trim().toLowerCase()}`
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${connector}-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function cleanHtml(value: string) {
  return cheerio.load(`<main>${value}</main>`).text().replace(/\s+/g, ' ').trim()
}

function inferModes(text: string): ParticipationMode[] {
  const normalized = text.toLowerCase()
  const modes: ParticipationMode[] = []
  if (normalized.includes('consortium')) modes.push('consortium')
  if (normalized.includes('company') || normalized.includes('companies') || normalized.includes('organisation') || normalized.includes('organization')) modes.push('company')
  if (normalized.includes('team')) modes.push('team')
  if (normalized.includes('individual') || normalized.includes('solo') || normalized.includes('open to all')) modes.push('individual')
  return modes.length ? [...new Set(modes)] : ['unknown']
}

function devpostDeadline(value: string) {
  const match = value.match(
    /^([A-Z][a-z]{2})\s+\d{1,2}\s*-\s*(?:([A-Z][a-z]{2})\s+)?(\d{1,2}),\s*(\d{4})$/,
  )
  if (!match) return null
  const parsed = new Date(`${match[2] ?? match[1]} ${match[3]}, ${match[4]} 23:59:59 UTC`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export async function searchDevpost(query: string): Promise<OpportunityCandidate[]> {
  const result = await cachedResult('connector-devpost-v2', { query }, async () => {
    const url = new URL('https://devpost.com/api/hackathons')
    url.searchParams.set('challenge_type', 'online')
    url.searchParams.set('sort_by', 'Submission Deadline')
    url.searchParams.set('page', '1')
    if (query.trim()) url.searchParams.set('search', query.trim())
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', 'User-Agent': 'RareBuilders/1.0' },
    })
    if (!response.ok) throw new PublicError(`Devpost returned ${response.status}.`)
    const payload = await response.json() as {
      hackathons: Array<{
        id: number
        title: string
        url: string
        organization_name: string
        displayed_location?: { location?: string }
        submission_period_dates: string
        time_left_to_submission: string
        themes: Array<{ name: string }>
        prize_amount: string
        registrations_count: number
        invite_only: boolean
      }>
    }
    const seenAt = now()
    return payload.hackathons
      .map((item) => ({ item, deadline: devpostDeadline(item.submission_period_dates) }))
      .filter(({ item, deadline }) =>
        !item.time_left_to_submission.toLowerCase().includes('ended')
        && (!deadline || new Date(deadline).getTime() >= Date.now()))
      .slice(0, 20)
      .map(({ item, deadline }): OpportunityCandidate => ({
        id: idFor('devpost', String(item.id)),
        connector: 'devpost',
        externalId: String(item.id),
        canonicalUrl: item.url,
        title: item.title.trim(),
        organizer: item.organization_name || 'Devpost organizer',
        summary: `${item.time_left_to_submission}. ${item.registrations_count.toLocaleString()} registrations shown on Devpost.`,
        deadline,
        reward: cleanHtml(item.prize_amount),
        region: item.displayed_location?.location === 'Online' ? 'global' : item.displayed_location?.location || 'unknown',
        language: 'English',
        tags: item.themes.map((theme) => theme.name),
        participationModes: item.invite_only ? ['unknown'] : ['individual', 'team'],
        discoveredAt: seenAt,
        lastSeenAt: seenAt,
        status: 'new',
      }))
  }, 60 * 30)
  return result.data
}

type EuSearchResult = {
  reference: string
  url: string
  summary: string
  content: string
  language?: string
  database?: string
  metadata?: Record<string, string[]>
}

function firstMetadata(result: EuSearchResult, fragments: string[]) {
  const entry = Object.entries(result.metadata ?? {}).find(([key]) =>
    fragments.some((fragment) => key.toLowerCase().includes(fragment)))
  return entry?.[1]?.find(Boolean)
}

export async function searchEuFunding(query: string): Promise<OpportunityCandidate[]> {
  const result = await cachedResult('connector-eu-v1', { query }, async () => {
    const url = new URL('https://api.tech.ec.europa.eu/search-api/prod/rest/search')
    url.searchParams.set('apiKey', 'SEDIA')
    url.searchParams.set('text', query.trim() || 'digital innovation')
    url.searchParams.set('pageSize', '60')
    url.searchParams.set('pageNumber', '1')
    url.searchParams.set('language', 'en')
    const form = new FormData()
    form.set('query', new Blob([JSON.stringify({
      bool: {
        must: [
          { terms: { type: ['1'] } },
          { terms: { status: ['31094501'] } },
        ],
      },
    })], { type: 'application/json' }))
    const response = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: 'application/json', 'User-Agent': 'RareBuilders/1.0' },
    })
    if (!response.ok) throw new PublicError(`EU Funding & Tenders returned ${response.status}.`)
    const payload = await response.json() as { results?: EuSearchResult[] }
    const seenAt = now()
    const unique = new Map<string, EuSearchResult>()
    for (const item of payload.results ?? []) {
      if (item.database !== 'SEDIA' || !(item.metadata?.type ?? []).includes('1')) continue
      const key = firstMetadata(item, ['identifier']) ?? item.url ?? item.reference
      const current = unique.get(key)
      if (!current || item.language === 'en' || (item.language === 'es' && current.language !== 'en')) {
        unique.set(key, item)
      }
    }
    return [...unique.values()]
      .filter((item) => item.database === 'SEDIA' && (item.metadata?.type ?? []).includes('1'))
      .slice(0, 20)
      .map((item): OpportunityCandidate => {
        const description = cleanHtml(firstMetadata(item, ['descriptionbyte', 'description']) ?? item.content ?? item.summary)
        const modes = inferModes(description)
        const deadlineValue = firstMetadata(item, ['deadline'])
        const deadline = deadlineValue && !Number.isNaN(new Date(deadlineValue).getTime())
          ? new Date(deadlineValue).toISOString()
          : null
        return {
          id: idFor('eu', item.reference),
          connector: 'eu',
          externalId: item.reference,
          canonicalUrl: item.url,
          title: cleanHtml(item.summary || item.content).slice(0, 240) || item.reference,
          organizer: 'European Commission',
          summary: description.slice(0, 700),
          deadline,
          reward: firstMetadata(item, ['budget']) ?? '',
          region: 'europe',
          language: item.language === 'es' ? 'Spanish' : item.language === 'en' ? 'English' : item.language?.toUpperCase() || 'English',
          tags: [
            ...(item.metadata?.keywords ?? []).slice(0, 8),
            ...(item.metadata?.callIdentifier ?? []).slice(0, 2),
          ],
          participationModes: modes,
          sourceText: description.slice(0, 8_000),
          discoveredAt: seenAt,
          lastSeenAt: seenAt,
          status: 'new',
        }
      })
  }, 60 * 60)
  return result.data
}

type KaggleCompetition = {
  ref: string
  title: string
  url?: string
  description?: string
  deadline?: string
  reward?: string
  category?: string
  organizationName?: string
  tags?: Array<{ name?: string; ref?: string }>
  teamCount?: number
}

function kaggleConfigured() {
  return Boolean(
    process.env.KAGGLE_API_TOKEN
    || (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY),
  )
}

export async function searchKaggle(query: string): Promise<OpportunityCandidate[]> {
  if (!kaggleConfigured()) {
    throw new PublicError('Kaggle credentials are not configured.')
  }
  const result = await cachedResult('connector-kaggle-v2', { query }, async () => {
    const url = new URL('https://www.kaggle.com/api/v1/competitions/list')
    url.searchParams.set('group', 'general')
    url.searchParams.set('sortBy', 'latestDeadline')
    if (query.trim()) url.searchParams.set('search', query.trim())
    const authorization = process.env.KAGGLE_API_TOKEN
      ? `Bearer ${process.env.KAGGLE_API_TOKEN}`
      : `Basic ${Buffer.from(`${process.env.KAGGLE_USERNAME}:${process.env.KAGGLE_KEY}`).toString('base64')}`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', Authorization: authorization, 'User-Agent': 'RareBuilders/1.0' },
    })
    if (!response.ok) throw new PublicError(`Kaggle returned ${response.status}.`)
    const payload = await response.json() as KaggleCompetition[]
    const seenAt = now()
    return payload
      .filter((item) => !item.deadline || new Date(item.deadline).getTime() >= Date.now())
      .slice(0, 20)
      .map((item): OpportunityCandidate => ({
      id: idFor('kaggle', item.ref),
      connector: 'kaggle',
      externalId: item.ref,
      canonicalUrl: item.url || `https://www.kaggle.com/competitions/${encodeURIComponent(item.ref)}`,
      title: item.title,
      organizer: item.organizationName || 'Kaggle',
      summary: `${item.description ?? item.category ?? 'Data competition'}${item.teamCount ? ` · ${item.teamCount} teams` : ''}`,
      deadline: item.deadline ?? null,
      reward: item.reward ?? '',
      region: 'global',
      language: 'English',
      tags: (item.tags ?? []).map((tag) => tag.name ?? tag.ref ?? '').filter(Boolean),
      participationModes: ['individual', 'team'],
      discoveredAt: seenAt,
      lastSeenAt: seenAt,
      status: 'new',
      }))
  }, 60 * 60)
  return result.data
}

export async function searchGithubCandidates(query: string): Promise<OpportunityCandidate[]> {
  const focus = query.trim()
  const result = await searchOpportunityIssues(
    focus
      ? `${focus} bounty no:assignee`
      : 'is:issue is:open label:bounty no:assignee',
  )
  const seenAt = now()
  return result.data
    .filter((item) => {
      const text = `${item.title}\n${item.labels.join(' ')}\n${item.body}`.toLowerCase()
      const hasOpportunitySignal = /\b(bounty|reward|prize|grant|paid task|compensation)\b/.test(text)
        || /(?:[$€£]\s?\d|\d[\d,.]*\s?(?:usd|usdc|eur|sats|tokens?))\b/i.test(text)
      const looksLikeFeed = /\b(daily|weekly) (?:update|report|pulse)\b|github update|active vulnerability tracker/i.test(item.title)
      return hasOpportunitySignal && !looksLikeFeed
    })
    .map((item): OpportunityCandidate => ({
    id: idFor('github', String(item.id)),
    connector: 'github',
    externalId: String(item.id),
    canonicalUrl: item.url,
    title: item.title,
    organizer: item.repository,
    summary: item.body.slice(0, 700),
    deadline: null,
    reward: '',
    region: 'global',
    language: 'English',
    tags: item.labels,
    participationModes: ['individual', 'team'],
    sourceText: [
      `Title: ${item.title}`,
      `Repository: ${item.repository}`,
      `Labels: ${item.labels.join(', ') || 'none'}`,
      '',
      item.body,
    ].join('\n').slice(0, 12_000),
    discoveredAt: seenAt,
    lastSeenAt: seenAt,
    status: 'new',
    }))
}

const connectorHandlers: Record<
  AutomatedConnectorId,
  (query: string) => Promise<OpportunityCandidate[]>
> = {
  github: searchGithubCandidates,
  devpost: searchDevpost,
  eu: searchEuFunding,
  kaggle: searchKaggle,
}

export async function searchConnector(
  connector: AutomatedConnectorId,
  query: string,
): Promise<ConnectorSearchResult> {
  try {
    const normalizedQuery = query.trim().replace(/\s+/g, ' ')
    const candidates = await connectorHandlers[connector](normalizedQuery)
    return { connector, candidates, configured: true }
  } catch (error) {
    return {
      connector,
      candidates: [],
      configured: connector !== 'kaggle' || kaggleConfigured(),
      error: error instanceof PublicError ? error.message : 'Connector temporarily unavailable.',
    }
  }
}
