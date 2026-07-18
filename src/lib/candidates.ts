import type { BuilderProfile, ConnectorId, OpportunityCandidate } from '../../shared/domain'

export function candidateId(connector: ConnectorId, externalId: string) {
  let hash = 2166136261
  const value = `${connector}:${externalId.trim().toLowerCase()}`
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `${connector}-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

const stopWords = new Set([
  'and', 'the', 'for', 'with', 'from', 'this', 'that', 'into', 'build', 'using',
  'para', 'con', 'por', 'una', 'del', 'las', 'los', 'que',
  'tools', 'technology', 'project', 'challenge', 'competition', 'form', 'launch',
  'source', 'public', 'open', 'code', 'site', 'app', 'platform', 'content',
])

const concepts: Array<{ label: string; signals: string[] }> = [
  { label: 'AI agents', signals: ['ai-agent', 'ai-agents', 'agentic', 'agent-workflow', 'mcp', 'multi-agent'] },
  { label: 'AI developer tools', signals: ['developer-tool', 'devtool', 'sdk', 'cli', 'coding-agent', 'code-agent', 'mcp'] },
  { label: 'model evaluation', signals: ['benchmark', 'evaluation', 'evals', 'model-evaluation', 'llm-eval'] },
  { label: 'AI safety', signals: ['ai-safety', 'guardrail', 'alignment', 'content-safety', 'red-team'] },
  { label: 'computer vision', signals: ['computer-vision', 'pose-estimation', 'tracking', 'opencv', 'vision'] },
  { label: 'sports analytics', signals: ['sports-analytics', 'football-analytics', 'player-tracking', 'sport'] },
  { label: 'publishing', signals: ['publishing', 'author', 'book', 'reader', 'editorial'] },
  { label: 'creative technology', signals: ['creative-tech', 'generative-media', 'music-tech', 'creative-coding'] },
  { label: 'open source', signals: ['open-source', 'oss', 'github'] },
]

const noGoAliases: Record<string, string[]> = {
  'generic-web-frameworks': ['next.js', 'nextjs', 'react-template', 'vue-template', 'angular-template', 'web-framework'],
  'basic-devops': ['basic-devops', 'terraform-setup', 'kubernetes-setup', 'ci-cd-setup', 'infrastructure-setup'],
  'general-productivity': ['general-productivity', 'todo-app', 'task-manager', 'calendar-app'],
  hype: ['hype', 'viral-trend', 'growth-hack'],
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/c\+\+/g, 'cplusplus')
    .replace(/c#/g, 'csharp')
    .replace(/[^a-z0-9+#.]+/g, '-')
    .replace(/^-|-$/g, '')
}

function tokens(values: string[]) {
  return new Set(values
    .flatMap((value) => {
      const normalized = normalize(value)
      return [normalized, ...normalized.split('-')]
    })
    .filter((value) => (value.length > 2 || ['ai', 'ml', '3d', 'xr'].includes(value)) && !stopWords.has(value)))
}

function profileValues(profile: BuilderProfile) {
  return [
    ...profile.domains,
    ...profile.wildcardDomains,
    ...profile.fastSkills,
    ...profile.careerProfile.skills.map((skill) => skill.name),
    ...profile.projects.flatMap((project) => [
      ...project.domains,
      ...project.technologies,
      ...project.reusableAssets,
    ]),
  ]
}

export function candidatePreFitDetails(profile: BuilderProfile, candidate: OpportunityCandidate) {
  const builderValues = profileValues(profile)
  const candidateValues = [candidate.title, candidate.summary, ...candidate.tags]
  const builderTokens = tokens(builderValues)
  const candidateTokens = tokens(candidateValues)
  const directMatches = [...candidateTokens].filter((token) => builderTokens.has(token))
  const builderText = builderValues.map(normalize).join(' ')
  const candidateText = candidateValues.map(normalize).join(' ')
  const conceptMatches = concepts
    .filter((concept) =>
      concept.signals.some((signal) => builderText.includes(signal))
      && concept.signals.some((signal) => candidateText.includes(signal)))
    .map((concept) => concept.label)
  const noGoMatches = profile.noGoDomains.filter((value) => {
    const normalized = normalize(value)
    const aliases = [normalized, ...(noGoAliases[normalized] ?? [])]
    return aliases.some((alias) => candidateText.includes(alias))
  })
  let overlap = 0
  for (const token of directMatches) {
    overlap += candidate.title.toLowerCase().includes(token) || candidate.tags.some((tag) => normalize(tag).includes(token))
      ? 2
      : 1
  }
  const modeMatch = candidate.participationModes.includes('unknown')
    || candidate.participationModes.some((mode) => profile.participationModes.includes(mode))
  const languageMatch = profile.languages.some((language) =>
    language.toLowerCase() === candidate.language.toLowerCase())
  const regionMatch = profile.regions.includes('global') || profile.regions.includes(candidate.region)
  const score = Math.max(0, Math.min(
    100,
    16
      + Math.min(42, overlap * 6)
      + Math.min(24, conceptMatches.length * 12)
      + (modeMatch ? 8 : -14)
      + (languageMatch ? 5 : -5)
      + (regionMatch ? 5 : -8)
      - Math.min(45, noGoMatches.length * 24),
  ))
  const matches = [
    ...conceptMatches,
    ...directMatches
      .filter((match) => !conceptMatches.some((concept) => normalize(concept).includes(match)))
      .slice(0, 4),
  ].slice(0, 4)
  return {
    score,
    matches,
    noGoMatches: noGoMatches.slice(0, 3),
  }
}

export function candidatePreFit(profile: BuilderProfile, candidate: OpportunityCandidate) {
  return candidatePreFitDetails(profile, candidate).score
}

export function canonicalCandidateKey(candidate: OpportunityCandidate) {
  if (candidate.canonicalUrl) {
    try {
      const url = new URL(candidate.canonicalUrl)
      url.hash = ''
      url.search = ''
      return `url:${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, '').toLowerCase()}`
    } catch {
      // Fall through to a stable title/organizer fingerprint.
    }
  }
  return `text:${normalize(candidate.organizer)}:${normalize(candidate.title)}`
}

export function profileDiscoveryFocus(profile: BuilderProfile) {
  const priorities = [
    ...profile.domains,
    ...profile.careerProfile.skills.map((skill) => skill.name),
    ...profile.fastSkills,
  ]
    .map((value) => value.replaceAll('-', ' ').trim())
    .filter((value) => value.length > 2 && !['ai', 'software', 'technology'].includes(value.toLowerCase()))
  const unique = [...new Set(priorities.map((value) => value.toLowerCase()))]
  return unique.slice(0, 2).join(' ')
}

export function retainCandidateHistory(candidates: OpportunityCandidate[]) {
  const recentFirst = [...candidates].sort(
    (left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt),
  )
  const deduplicated = new Map<string, OpportunityCandidate>()
  for (const candidate of recentFirst) {
    const key = canonicalCandidateKey(candidate)
    const existing = deduplicated.get(key)
    if (!existing || (existing.status === 'new' && candidate.status !== 'new')) {
      deduplicated.set(key, candidate)
    }
  }
  const unique = [...deduplicated.values()].sort(
    (left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt),
  )
  const decisions = unique
    .filter((candidate) => candidate.status !== 'new')
    .slice(0, 100)
  const freshPerConnector = new Map<ConnectorId, number>()
  const fresh = unique.filter((candidate) => {
    if (candidate.status !== 'new') return false
    const count = freshPerConnector.get(candidate.connector) ?? 0
    if (count >= 30) return false
    freshPerConnector.set(candidate.connector, count + 1)
    return true
  })
  const kept = new Map([...decisions, ...fresh].map((candidate) => [candidate.id, candidate]))
  return unique.filter((candidate) => kept.has(candidate.id))
}
