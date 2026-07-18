import { lookup } from 'node:dns/promises'
import ipaddr from 'ipaddr.js'
import * as cheerio from 'cheerio'
import { Agent } from 'undici'
import { PublicError } from './http.js'

const MAX_DOCUMENT_BYTES = 5_000_000
const MAX_TEXT_BYTES = 2_000_000
const MAX_REDIRECTS = 3
const MAX_TEXT = 30_000
const MAX_PDF_PAGES = 60
const ALLOWED_TYPES = [
  'text/html',
  'text/plain',
  'text/markdown',
  'application/xhtml+xml',
  'application/xml',
  'application/pdf',
]

export type SourceExtractionMethod =
  | 'github-api'
  | 'eu-api'
  | 'devpost-api'
  | 'kaggle-api'
  | 'semantic-html'
  | 'plain-text'
  | 'pdf'

export type SourceExtraction = {
  url: string
  title: string
  text: string
  method: SourceExtractionMethod
  contentType: string
  wordCount: number
  warnings: string[]
}

function assertPublicIp(address: string) {
  const parsed = ipaddr.parse(address)
  if (parsed.range() !== 'unicast') throw new PublicError('Private, local and reserved network addresses are not allowed.')
}

type ResolvedAddress = { address: string; family: 4 | 6 }

async function assertSafeUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new PublicError('Enter a valid public URL.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new PublicError('Only HTTP and HTTPS sources are supported.')
  if (url.username || url.password) throw new PublicError('URLs containing credentials are not allowed.')
  let addresses: ResolvedAddress[]
  if (ipaddr.isValid(url.hostname)) {
    assertPublicIp(url.hostname)
    addresses = [{
      address: url.hostname,
      family: ipaddr.parse(url.hostname).kind() === 'ipv6' ? 6 : 4,
    }]
  } else {
    try {
      const resolved = await lookup(url.hostname, { all: true })
      if (!resolved.length) throw new PublicError('The source hostname could not be resolved.')
      resolved.forEach(({ address }) => assertPublicIp(address))
      addresses = resolved.map(({ address, family }) => ({
        address,
        family: family === 6 ? 6 : 4,
      }))
    } catch (error) {
      if (error instanceof PublicError) throw error
      throw new PublicError('The source hostname could not be resolved.')
    }
  }
  return { url, addresses }
}

function pinnedDispatcher(addresses: ResolvedAddress[]) {
  return new Agent({
    connect: {
      lookup: (_hostname, options, callback) => {
        const matching = options.family
          ? addresses.filter((address) => address.family === options.family)
          : addresses
        const selected = matching.length ? matching : addresses
        if (options.all) {
          callback(null, selected)
          return
        }
        callback(null, selected[0].address, selected[0].family)
      },
    },
  })
}

async function readLimitedBody(response: Response, maximum = MAX_DOCUMENT_BYTES) {
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  const sizeLabel = maximum === MAX_DOCUMENT_BYTES ? '5 MB' : '2 MB'
  if (contentLength > maximum) throw new PublicError(`The source is larger than the ${sizeLabel} import limit.`)
  if (!response.body) return new Uint8Array()
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > maximum) {
      await reader.cancel()
      throw new PublicError(`The source is larger than the ${sizeLabel} import limit.`)
    }
    chunks.push(value)
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await readLimitedBody(response)
  return JSON.parse(new TextDecoder().decode(body)) as T
}

function normalizeText(value: string) {
  const lines = value
    .normalize('NFKC')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t\f\v]+/g, ' ').trim())
    .filter(Boolean)
  const deduplicated = lines.filter((line, index) => line !== lines[index - 1])
  return deduplicated.join('\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TEXT)
}

function wordCount(value: string) {
  return value ? value.split(/\s+/).filter(Boolean).length : 0
}

function titleFromUrl(url: URL) {
  const segment = url.pathname.split('/').filter(Boolean).at(-1) ?? ''
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    // A malformed escape in a third-party URL should not abort extraction.
  }
  const filename = decoded
    .replace(/\.(pdf|html?|txt|md)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  return filename || url.hostname
}

function htmlToStructuredText(html: string) {
  const $ = cheerio.load(`<main>${html}</main>`)
  $('script, style, noscript, svg, nav, footer, form, dialog, template').remove()
  $('br').replaceWith('\n')
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    $(element).prepend('\n## ').append('\n')
  })
  $('li').each((_, element) => {
    $(element).prepend('\n- ').append('\n')
  })
  $('p, blockquote, pre, table, tr, dt, dd, section').each((_, element) => {
    $(element).append('\n')
  })
  return normalizeText($('main').text())
}

function sourceQuality(text: string) {
  const normalized = text.toLowerCase()
  const opportunityTerms = [
    'deadline', 'submission', 'eligibility', 'eligible', 'prize', 'award', 'grant',
    'bounty', 'requirements', 'deliverables', 'apply', 'judging', 'rules',
    'fecha límite', 'premio', 'requisitos', 'convocatoria', 'solicitud',
  ]
  const termScore = opportunityTerms.reduce(
    (score, term) => score + (normalized.includes(term) ? 5 : 0),
    0,
  )
  const structureScore = Math.min(18, (text.match(/\n/g)?.length ?? 0) * 0.8)
  const lengthScore = Math.min(60, text.length / 180)
  const boilerplatePenalty = ['cookie settings', 'privacy preferences', 'sign in to continue']
    .reduce((score, phrase) => score + (normalized.includes(phrase) ? 12 : 0), 0)
  return termScore + structureScore + lengthScore - boilerplatePenalty
}

function jsonLdObjects($: cheerio.CheerioAPI) {
  const values: unknown[] = []
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text()) as unknown
      values.push(parsed)
    } catch {
      // Broken third-party metadata must not prevent reading the visible page.
    }
  })
  const flattened: Record<string, unknown>[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (!value || typeof value !== 'object') return
    const record = value as Record<string, unknown>
    flattened.push(record)
    if ('@graph' in record) visit(record['@graph'])
  }
  values.forEach(visit)
  return flattened
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(', ')
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  return textValue(record.name ?? record.description ?? record.address ?? record.url)
}

function structuredMetadata($: cheerio.CheerioAPI) {
  const records = jsonLdObjects($)
    .filter((record) => record.name || record.headline || record.description || record.endDate || record.validThrough)
    .slice(0, 4)
  const lines: string[] = []
  for (const record of records) {
    const fields: Array<[string, unknown]> = [
      ['Title', record.name ?? record.headline],
      ['Description', record.description],
      ['Start date', record.startDate],
      ['End date', record.endDate ?? record.validThrough],
      ['Organizer', record.organizer ?? record.provider],
      ['Location', record.location],
      ['Attendance', record.eventAttendanceMode],
      ['Offer or reward', record.offers],
    ]
    for (const [label, value] of fields) {
      const text = textValue(value)
      if (text && !lines.includes(`${label}: ${text}`)) lines.push(`${label}: ${text}`)
    }
  }
  return normalizeText(lines.join('\n'))
}

export function extractHtmlSource(raw: string, sourceUrl: string): SourceExtraction {
  const url = new URL(sourceUrl)
  const $ = cheerio.load(raw)
  const pageTitle = (
    $('meta[property="og:title"]').attr('content')
    || $('title').first().text()
    || $('h1').first().text()
    || titleFromUrl(url)
  ).replace(/\s+/g, ' ').trim().slice(0, 200)
  const metadata = structuredMetadata($)
  const candidates: Array<{ method: 'semantic-html'; text: string }> = []

  const selectors = [
    'main',
    '[role="main"]',
    'article',
    '#main-content',
    '.main-content',
    '.challenge-description',
    '.opportunity-details',
    '.entry-content',
    '.post-content',
    '.content',
  ]
  for (const selector of selectors) {
    $(selector).slice(0, 8).each((_, element) => {
      const text = htmlToStructuredText($.html(element))
      if (text.length >= 80) candidates.push({ method: 'semantic-html', text })
    })
  }
  if (!candidates.length) {
    const body = htmlToStructuredText($('body').html() ?? '')
    if (body) candidates.push({ method: 'semantic-html', text: body })
  }

  candidates.sort((left, right) => sourceQuality(right.text) - sourceQuality(left.text))
  const chosen = candidates[0]
  const visibleText = chosen?.text ?? ''
  const metaDescription = (
    $('meta[name="description"]').attr('content')
    || $('meta[property="og:description"]').attr('content')
    || ''
  ).trim()
  const text = normalizeText([
    metadata ? '## Structured page metadata' : '',
    metadata,
    metaDescription && !visibleText.includes(metaDescription) ? '## Page summary' : '',
    metaDescription && !visibleText.includes(metaDescription) ? metaDescription : '',
    visibleText ? '## Main source content' : '',
    visibleText,
  ].filter(Boolean).join('\n'))
  if (text.length < 80) throw new PublicError('The page did not expose enough readable text. Paste the announcement instead.')

  const warnings: string[] = []
  if (text.length < 600) warnings.push('This page exposed little readable detail; verify the original before relying on the analysis.')
  if (raw.length > 50_000 && text.length < 500) warnings.push('The page appears to rely on JavaScript or gated content.')
  if (text.length >= MAX_TEXT) warnings.push('The extracted source was trimmed to 30,000 characters.')

  return {
    url: sourceUrl,
    title: pageTitle,
    text,
    method: chosen?.method ?? 'semantic-html',
    contentType: 'text/html',
    wordCount: wordCount(text),
    warnings,
  }
}

async function extractPdfSource(body: Uint8Array, url: URL, contentType: string): Promise<SourceExtraction> {
  const canvas = await import('@napi-rs/canvas')
  Object.assign(globalThis, {
    DOMMatrix: canvas.DOMMatrix,
    ImageData: canvas.ImageData,
    Path2D: canvas.Path2D,
  })
  const { PDFParse } = await import('pdf-parse')
  const parser = new PDFParse({ data: body })
  try {
    const result = await parser.getText({ first: MAX_PDF_PAGES })
    const text = normalizeText(result.text)
    if (text.length < 80) {
      throw new PublicError('The PDF contains too little selectable text. It may need OCR; paste the relevant pages instead.')
    }
    const warnings = [
      ...(result.total > MAX_PDF_PAGES
        ? [`Only the first ${MAX_PDF_PAGES} of ${result.total} PDF pages were imported.`]
        : []),
      ...(text.length >= MAX_TEXT
        ? ['The extracted PDF text was trimmed to 30,000 characters.']
        : []),
    ]
    return {
      url: url.toString(),
      title: titleFromUrl(url),
      text,
      method: 'pdf',
      contentType,
      wordCount: wordCount(text),
      warnings,
    }
  } finally {
    await parser.destroy()
  }
}

type GithubIssue = {
  title?: string
  body?: string | null
  html_url?: string
  state?: string
  user?: { login?: string }
  labels?: Array<{ name?: string } | string>
  milestone?: { title?: string; due_on?: string | null } | null
  created_at?: string
  updated_at?: string
  comments?: number
}

async function fetchGithubIssue(url: URL): Promise<SourceExtraction | null> {
  if (url.hostname.toLowerCase() !== 'github.com') return null
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/)
  if (!match) return null
  const [, owner, repository, kind, number] = match
  const endpoint = kind === 'pull' ? 'pulls' : 'issues'
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'RareBuilders/1.0',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${endpoint}/${number}`,
    { signal: AbortSignal.timeout(8_000), headers },
  )
  if (!response.ok) return null
  const body = await readLimitedBody(response)
  const issue = JSON.parse(new TextDecoder().decode(body)) as GithubIssue
  const labels = (issue.labels ?? []).map((label) => typeof label === 'string' ? label : label.name).filter(Boolean)
  const text = normalizeText([
    `Title: ${issue.title ?? `${owner}/${repository} #${number}`}`,
    `Repository: ${owner}/${repository}`,
    `Type: GitHub ${kind === 'pull' ? 'pull request' : 'issue'}`,
    `State: ${issue.state ?? 'unknown'}`,
    `Author: ${issue.user?.login ?? 'unknown'}`,
    `Labels: ${labels.join(', ') || 'none'}`,
    `Milestone: ${issue.milestone?.title ?? 'none'}`,
    `Milestone due: ${issue.milestone?.due_on ?? 'unknown'}`,
    `Created: ${issue.created_at ?? 'unknown'}`,
    `Updated: ${issue.updated_at ?? 'unknown'}`,
    `Comments: ${issue.comments ?? 'unknown'}`,
    '',
    '## Original description',
    issue.body ?? '',
  ].join('\n'))
  if (text.length < 80) return null
  return {
    url: issue.html_url ?? url.toString(),
    title: issue.title?.slice(0, 200) || `${owner}/${repository} #${number}`,
    text,
    method: 'github-api',
    contentType: 'application/vnd.github+json',
    wordCount: wordCount(text),
    warnings: [],
  }
}

type EuSourceResult = {
  url?: string
  summary?: string
  language?: string
  metadata?: Record<string, string[]>
}

function firstMetadata(metadata: Record<string, string[]> | undefined, key: string) {
  const entry = Object.entries(metadata ?? {}).find(([name]) => name.toLowerCase() === key.toLowerCase())
  return entry?.[1]?.find(Boolean) ?? ''
}

function euBudget(metadata: Record<string, string[]> | undefined, identifier: string) {
  try {
    const overview = JSON.parse(firstMetadata(metadata, 'budgetOverview')) as {
      budgetTopicActionMap?: Record<string, Array<{
        action?: string
        expectedGrants?: number
        minContribution?: number
        maxContribution?: number
        budgetYearMap?: Record<string, string>
      }>>
    }
    const actions = Object.values(overview.budgetTopicActionMap ?? {}).flat()
    const action = actions.find((item) => item.action?.startsWith(identifier))
    if (!action) return ''
    const total = Object.values(action.budgetYearMap ?? {}).reduce((sum, value) => sum + Number(value || 0), 0)
    return [
      total ? `Topic budget: €${total.toLocaleString('en')}` : '',
      action.expectedGrants ? `Expected grants: ${action.expectedGrants}` : '',
      action.minContribution ? `Minimum contribution: €${action.minContribution.toLocaleString('en')}` : '',
      action.maxContribution ? `Maximum contribution: €${action.maxContribution.toLocaleString('en')}` : '',
    ].filter(Boolean).join('\n')
  } catch {
    return ''
  }
}

async function fetchEuFundingTopic(url: URL): Promise<SourceExtraction | null> {
  if (url.hostname.toLowerCase() !== 'ec.europa.eu') return null
  const match = url.pathname.match(/\/topic-details\/([^/?#]+)/i)
  if (!match) return null
  const identifier = decodeURIComponent(match[1])
  const endpoint = new URL('https://api.tech.ec.europa.eu/search-api/prod/rest/search')
  endpoint.searchParams.set('apiKey', 'SEDIA')
  endpoint.searchParams.set('text', identifier)
  endpoint.searchParams.set('pageSize', '30')
  endpoint.searchParams.set('pageNumber', '1')
  endpoint.searchParams.set('language', 'en')
  const form = new FormData()
  form.set('query', new Blob([JSON.stringify({
    bool: { must: [{ terms: { type: ['1'] } }] },
  })], { type: 'application/json' }))
  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: 'application/json', 'User-Agent': 'RareBuilders/1.0' },
  })
  if (!response.ok) return null
  const payload = await readJson<{ results?: EuSourceResult[] }>(response)
  const matches = (payload.results ?? []).filter((result) =>
    firstMetadata(result.metadata, 'identifier').toLowerCase() === identifier.toLowerCase()
    || result.url?.toLowerCase() === url.toString().toLowerCase())
  const item = matches.find((result) => result.language === 'en') ?? matches[0]
  if (!item) return null
  const title = firstMetadata(item.metadata, 'title') || item.summary || identifier
  const description = htmlToStructuredText(firstMetadata(item.metadata, 'descriptionByte'))
  const conditions = htmlToStructuredText(firstMetadata(item.metadata, 'topicConditions'))
  const deadlines = firstMetadata(item.metadata, 'deadlineDate')
  const text = normalizeText([
    `Title: ${title}`,
    `Identifier: ${identifier}`,
    `Call: ${firstMetadata(item.metadata, 'callIdentifier') || 'unknown'}`,
    `Action type: ${firstMetadata(item.metadata, 'typesOfAction') || 'unknown'}`,
    `Opening date: ${firstMetadata(item.metadata, 'startDate') || 'unknown'}`,
    `Deadlines: ${deadlines || 'unknown'}`,
    euBudget(item.metadata, identifier),
    '',
    '## Scope and expected outcomes',
    description,
    '',
    '## Topic conditions',
    conditions,
  ].join('\n'))
  if (text.length < 80) return null
  return {
    url: item.url ?? url.toString(),
    title: title.slice(0, 200),
    text,
    method: 'eu-api',
    contentType: 'application/json',
    wordCount: wordCount(text),
    warnings: text.length >= MAX_TEXT ? ['The EU call was trimmed to 30,000 characters.'] : [],
  }
}

type DevpostSource = {
  id: number
  title: string
  url: string
  organization_name?: string
  submission_period_dates?: string
  time_left_to_submission?: string
  themes?: Array<{ name?: string }>
  prize_amount?: string
  registrations_count?: number
  displayed_location?: { location?: string }
}

export function matchDevpostChallenge(url: URL, candidates: DevpostSource[]) {
  return candidates.find((candidate) => {
    try {
      return new URL(candidate.url).hostname.toLowerCase() === url.hostname.toLowerCase()
    } catch {
      return false
    }
  })
}

async function fetchDevpostChallenge(url: URL): Promise<SourceExtraction | null> {
  if (!url.hostname.toLowerCase().endsWith('.devpost.com')) return null
  const slug = url.hostname.split('.')[0]
  if (!slug || slug === 'www') return null
  const endpoint = new URL('https://devpost.com/api/hackathons')
  endpoint.searchParams.set('search', slug.replaceAll('-', ' '))
  endpoint.searchParams.set('page', '1')
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: 'application/json', 'User-Agent': 'RareBuilders/1.0' },
  })
  if (!response.ok) return null
  const payload = await readJson<{ hackathons?: DevpostSource[] }>(response)
  const item = matchDevpostChallenge(url, payload.hackathons ?? [])
  if (!item) return null
  const text = normalizeText([
    `Title: ${item.title}`,
    `Organizer: ${item.organization_name ?? 'unknown'}`,
    `Submission period: ${item.submission_period_dates ?? 'unknown'}`,
    `Time remaining: ${item.time_left_to_submission ?? 'unknown'}`,
    `Prize: ${htmlToStructuredText(item.prize_amount ?? '') || 'unknown'}`,
    `Visible registrations: ${item.registrations_count ?? 'unknown'}`,
    `Location: ${item.displayed_location?.location ?? 'unknown'}`,
    `Themes: ${(item.themes ?? []).map((theme) => theme.name).filter(Boolean).join(', ') || 'unknown'}`,
  ].join('\n'))
  return {
    url: item.url || url.toString(),
    title: item.title.slice(0, 200),
    text,
    method: 'devpost-api',
    contentType: 'application/json',
    wordCount: wordCount(text),
    warnings: ['Devpost exposes summary metadata here; verify the original rules and eligibility before deciding.'],
  }
}

type KaggleSource = {
  ref?: string
  title?: string
  url?: string
  description?: string
  deadline?: string
  reward?: string
  category?: string
  organizationName?: string
  teamCount?: number
  tags?: Array<{ name?: string; ref?: string }>
}

export function matchKaggleCompetition(slug: string, competitions: KaggleSource[]) {
  return competitions.find((competition) => competition.ref === slug)
}

async function fetchKaggleCompetition(url: URL): Promise<SourceExtraction | null> {
  if (url.hostname.toLowerCase() !== 'www.kaggle.com' && url.hostname.toLowerCase() !== 'kaggle.com') return null
  const match = url.pathname.match(/^\/competitions\/([^/?#]+)/)
  if (!match) return null
  const token = process.env.KAGGLE_API_TOKEN
  const legacy = process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY
  if (!token && !legacy) return null
  const slug = decodeURIComponent(match[1])
  const endpoint = new URL('https://www.kaggle.com/api/v1/competitions/list')
  endpoint.searchParams.set('group', 'general')
  endpoint.searchParams.set('search', slug.replaceAll('-', ' '))
  const authorization = token
    ? `Bearer ${token}`
    : `Basic ${Buffer.from(`${process.env.KAGGLE_USERNAME}:${process.env.KAGGLE_KEY}`).toString('base64')}`
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: 'application/json', Authorization: authorization, 'User-Agent': 'RareBuilders/1.0' },
  })
  if (!response.ok) return null
  const payload = await readJson<KaggleSource[]>(response)
  const item = matchKaggleCompetition(slug, payload)
  if (!item?.title) return null
  const text = normalizeText([
    `Title: ${item.title}`,
    `Competition: ${item.ref ?? slug}`,
    `Organizer: ${item.organizationName ?? 'Kaggle'}`,
    `Deadline: ${item.deadline ?? 'unknown'}`,
    `Reward: ${item.reward ?? 'unknown'}`,
    `Category: ${item.category ?? 'unknown'}`,
    `Visible teams: ${item.teamCount ?? 'unknown'}`,
    `Tags: ${(item.tags ?? []).map((tag) => tag.name ?? tag.ref).filter(Boolean).join(', ') || 'unknown'}`,
    '',
    '## Description',
    item.description ?? '',
  ].join('\n'))
  return {
    url: item.url || url.toString(),
    title: item.title.slice(0, 200),
    text,
    method: 'kaggle-api',
    contentType: 'application/json',
    wordCount: wordCount(text),
    warnings: ['Verify competition rules and data-access requirements on Kaggle before entering.'],
  }
}

export async function fetchPublicSource(input: string): Promise<SourceExtraction> {
  let target = await assertSafeUrl(input)
  const adapters = [
    fetchGithubIssue,
    fetchEuFundingTopic,
    fetchDevpostChallenge,
    fetchKaggleCompetition,
  ]
  for (const adapter of adapters) {
    try {
      const adapted = await adapter(target.url)
      if (adapted) return adapted
    } catch {
      // A provider API is an optimization. The public page remains a valid fallback.
    }
  }

  let response: Response | null = null
  let dispatcher: Agent | null = null
  try {
    for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
      dispatcher = pinnedDispatcher(target.addresses)
      response = await fetch(target.url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'User-Agent': 'RareBuilders/1.0 (+https://github.com/DavidDiazMerino/rarebuilders)',
          Accept: 'text/html,text/plain,text/markdown,application/xhtml+xml,application/pdf',
        },
        dispatcher,
      } as RequestInit & { dispatcher: Agent })
      if (![301, 302, 303, 307, 308].includes(response.status)) break
      const location = response.headers.get('location')
      await response.body?.cancel()
      await dispatcher.close()
      dispatcher = null
      if (!location) throw new PublicError('The source returned an invalid redirect.')
      target = await assertSafeUrl(new URL(location, target.url).toString())
    }

    if (!response?.ok) throw new PublicError(`The source returned ${response?.status ?? 'no response'}.`)
    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    if (contentType && !ALLOWED_TYPES.some((allowed) => contentType.includes(allowed))) {
      throw new PublicError('Only HTML, text, Markdown and PDF sources can be imported.')
    }
    const pdfHint = contentType.includes('application/pdf')
      || target.url.pathname.toLowerCase().endsWith('.pdf')
    const body = await readLimitedBody(response, pdfHint ? MAX_DOCUMENT_BYTES : MAX_TEXT_BYTES)
    const isPdf = pdfHint
      || new TextDecoder().decode(body.slice(0, 5)) === '%PDF-'
    if (isPdf) return extractPdfSource(body, target.url, contentType || 'application/pdf')

    const raw = new TextDecoder().decode(body)
    if (contentType.includes('text/plain') || contentType.includes('text/markdown')) {
      const text = normalizeText(raw)
      if (text.length < 80) throw new PublicError('The source did not expose enough readable text.')
      return {
        url: target.url.toString(),
        title: titleFromUrl(target.url),
        text,
        method: 'plain-text',
        contentType: contentType || 'text/plain',
        wordCount: wordCount(text),
        warnings: text.length >= MAX_TEXT ? ['The extracted source was trimmed to 30,000 characters.'] : [],
      }
    }
    return extractHtmlSource(raw, target.url.toString())
  } finally {
    await dispatcher?.close().catch(() => undefined)
  }
}
