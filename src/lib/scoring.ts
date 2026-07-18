import type {
  BuilderProfile,
  FeedbackAction,
  FeedbackEvent,
  FeedbackKind,
  FeedbackReason,
  Opportunity,
  OpportunityEvaluation,
  RadarBucket,
  RadarBucketMatch,
  RadarItem,
  ScoreFactor,
  Verdict,
} from '../../shared/domain'
import { estimateHiddenness } from '../../shared/hiddenness'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const clampWeight = (value: number) => Math.max(-20, Math.min(20, value))

export const normalizeDomainSignal = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9+#.]+/g, '-')
  .replace(/^-+|-+$/g, '')

const domainFamilies: Record<string, string[]> = {
  ai: ['ai', 'artificial-intelligence', 'machine-learning', 'ai-agents', 'ai-tools', 'ai-safety', 'model-evaluation'],
  'ai-agents': ['ai-agents', 'agentic', 'agent-workflows', 'multi-agent', 'mcp'],
  'developer-tools': ['developer-tools', 'devtools', 'sdk', 'cli', 'coding-agents'],
  'creative-tech': ['creative-tech', 'creative-technology', 'generative-media', 'music', 'music-technology'],
  publishing: ['publishing', 'books', 'authors', 'readers', 'editorial'],
  'civic-tech': ['civic-tech', 'public-services', 'public-data', 'govtech'],
}

function expandedDomain(value: string) {
  const normalized = normalizeDomainSignal(value)
  const expanded = new Set([normalized])
  for (const [family, members] of Object.entries(domainFamilies)) {
    if (family === normalized || members.includes(normalized)) {
      expanded.add(family)
      members.forEach((member) => expanded.add(member))
    }
  }
  return expanded
}

function semanticallyMatches(left: string, right: string) {
  const rightSignals = expandedDomain(right)
  return [...expandedDomain(left)].some((signal) => rightSignals.has(signal))
}

const intersect = (left: string[], right: string[]) =>
  left.filter((item) => right.some((candidate) => semanticallyMatches(item, candidate)))

function domainAffinity(profile: BuilderProfile, opportunity: Opportunity) {
  const direct = intersect(profile.domains, opportunity.domains)
  const wildcard = intersect(profile.wildcardDomains, opportunity.domains)
  const blocked = intersect(profile.noGoDomains, opportunity.domains)
  const matchingLearnedKeys = Object.keys(profile.learnedDomainWeights).filter((domain) =>
    opportunity.domains.some((candidate) => semanticallyMatches(domain, candidate)))
  const learned = matchingLearnedKeys.reduce(
    (total, domain) => total + (profile.learnedDomainWeights[domain] ?? 0),
    0,
  )
  return { direct, wildcard, blocked, learned: clampWeight(learned) }
}

function rewardMatches(profile: BuilderProfile, opportunity: Opportunity) {
  const reward = opportunity.reward.toLowerCase()
  const signals: Record<BuilderProfile['rewardPreference'], string[]> = {
    money: ['$', '€', 'cash', 'prize', 'grant', 'bounty', 'stipend'],
    visibility: ['showcase', 'visibility', 'promotion', 'demo day', 'featured'],
    access: ['access', 'meeting', 'credits', 'device', 'partner', 'mentorship'],
    learning: ['learning', 'mentor', 'mentorship', 'workshop', 'research'],
    portfolio: ['showcase', 'open-source', 'prototype', 'publication'],
  }
  return signals[profile.rewardPreference].some((signal) => reward.includes(signal))
}

function teamMismatch(profile: BuilderProfile, opportunity: Opportunity) {
  if (profile.teamMode !== 'solo') return false
  const participationText = [...opportunity.requirements, ...opportunity.eligibility].join(' ').toLowerCase()
  return ['team required', 'teams only', 'team of ', 'minimum team'].some((signal) => participationText.includes(signal))
}

function participationMismatch(profile: BuilderProfile, opportunity: Opportunity) {
  return !opportunity.participationModes.includes('unknown')
    && !opportunity.participationModes.some((mode) => profile.participationModes.includes(mode))
}

function matchedProjects(profile: BuilderProfile, opportunity: Opportunity) {
  return profile.projects
    .map((project) => ({
      project,
      overlap: intersect(
        [...project.domains, ...project.technologies],
        opportunity.domains,
      ).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((left, right) => right.overlap - left.overlap)
    .map(({ project }) => project)
}

function latestFeedbackEvents(feedback: FeedbackEvent[]) {
  const latest = new Map<string, FeedbackEvent>()
  for (const event of feedback) latest.set(`${event.opportunityId}:${event.kind}`, event)
  return [...latest.values()]
}

function feedbackDelta(event: FeedbackEvent) {
  if (event.kind === 'preference') {
    if (event.action === 'more-like') return 5
    if (event.action === 'less-like') return -5
  }
  if (event.kind === 'decision' && event.action === 'passed' && event.reasonCode === 'domain-fit') {
    return -5
  }
  return 0
}

export function canonicalLearnedDomainWeights(weights: Record<string, number>) {
  const canonical: Record<string, number> = {}
  for (const [domain, weight] of Object.entries(weights)) {
    const key = normalizeDomainSignal(domain)
    if (!key) continue
    canonical[key] = clampWeight((canonical[key] ?? 0) + weight)
  }
  return canonical
}

export function learnedDomainWeightsFromFeedback(feedback: FeedbackEvent[]) {
  const learned: Record<string, number> = {}
  for (const event of latestFeedbackEvents(feedback)) {
    const delta = feedbackDelta(event)
    for (const domain of new Set(event.domains.map(normalizeDomainSignal).filter(Boolean))) {
      learned[domain] = clampWeight((learned[domain] ?? 0) + delta)
    }
  }
  return learned
}

export function learnedConstraintWeightsFromFeedback(feedback: FeedbackEvent[]) {
  const learned: Record<string, number> = {}
  for (const event of latestFeedbackEvents(feedback)) {
    if (
      event.kind !== 'decision'
      || event.action !== 'passed'
      || !event.reasonCode
      || event.reasonCode === 'domain-fit'
      || event.reasonCode === 'other'
    ) continue
    learned[event.reasonCode] = Math.min(20, (learned[event.reasonCode] ?? 0) + 4)
  }
  return learned
}

function deadlineState(opportunity: Opportunity, now: Date) {
  if (!opportunity.deadline) return { expired: false, days: null, weeks: 2 }
  const milliseconds = Date.parse(opportunity.deadline) - now.getTime()
  const days = milliseconds / 86_400_000
  return {
    expired: milliseconds < 0,
    days,
    weeks: Math.max(1, Math.min(8, days / 7)),
  }
}

function factor(label: string, impact: number, evidence: string): ScoreFactor {
  return {
    label,
    impact: Math.max(-100, Math.min(100, Math.round(impact))),
    evidence,
  }
}

function getVerdict(
  overall: number,
  risk: number,
  effortFit: number,
  verificationStatus: OpportunityEvaluation['verificationStatus'],
): Verdict {
  if (verificationStatus === 'closed') return 'closed'
  if (overall >= 76 && risk < 66 && effortFit >= 55 && verificationStatus === 'verified') return 'enter'
  if (overall >= 64) return 'investigate'
  if (overall >= 52) return 'monitor'
  if (overall >= 40) return 'recycle'
  return 'ignore'
}

export function evaluateOpportunity(
  profile: BuilderProfile,
  opportunity: Opportunity,
  now = new Date(),
): OpportunityEvaluation {
  const { direct, wildcard, blocked, learned } = domainAffinity(profile, opportunity)
  const hiddennessEstimate = estimateHiddenness(opportunity)
  const projects = matchedProjects(profile, opportunity)
  const documentedSkills = [
    ...profile.fastSkills,
    ...profile.careerProfile.skills.map((skill) => skill.name),
    ...profile.projects.flatMap((project) => project.technologies),
  ]
  const skillMatches = intersect(documentedSkills, opportunity.requiredSkills)
  const regionMatch = profile.regions.includes('global')
    || profile.regions.some((region) => semanticallyMatches(region, opportunity.region))
  const languageMatch = profile.languages.some((language) =>
    normalizeDomainSignal(language) === normalizeDomainSignal(opportunity.language))
  const rewardMatch = rewardMatches(profile, opportunity)
  const incompatibleTeam = teamMismatch(profile, opportunity)
  const incompatibleParticipation = participationMismatch(profile, opportunity)
  const projectReuseScore = clamp(projects.length * 38)
  const skillScore = clamp(skillMatches.length * 25)

  const fitFactors = [
    factor('Baseline', 20, 'Every inspected opportunity starts with a small neutral prior.'),
    factor('Core domains', direct.length * 18, direct.length ? direct.join(', ') : 'No core-domain overlap.'),
    factor('Wildcard domains', wildcard.length * 8, wildcard.length ? wildcard.join(', ') : 'No wildcard overlap.'),
    factor('Reusable projects', projectReuseScore * 0.2, projects.length ? projects[0].name : 'No matching project.'),
    factor('Documented skills', skillScore * 0.16, skillMatches.length ? skillMatches.join(', ') : 'No documented skill match.'),
    factor('Region and language', (regionMatch ? 7 : -8) + (languageMatch ? 6 : -6), `${opportunity.region} · ${opportunity.language}`),
    factor('Reward preference', rewardMatch ? 8 : 0, rewardMatch ? 'Reward matches the declared preference.' : 'No explicit reward match.'),
    factor('Learned domains', learned, learned ? 'Derived from the latest preference per opportunity.' : 'No learned adjustment.'),
    factor('No-go conflicts', blocked.length * -38, blocked.length ? blocked.join(', ') : 'No no-go conflict.'),
    factor('Participation', incompatibleTeam || incompatibleParticipation ? -24 : 0, incompatibleParticipation ? 'Declared participation path is unavailable.' : 'Participation path is available or unknown.'),
  ]
  const fit = clamp(fitFactors.reduce((total, item) => total + item.impact, 0))

  const hiddennessConfidence = clamp(
    hiddennessEstimate.confidence * 0.5
      + opportunity.confidence * 0.35
      + (opportunity.provenance.mode === 'live' && opportunity.provenance.evidenceRole === 'primary' ? 15 : 0),
  )
  const hiddenness = opportunity.provenance.mode === 'illustrative'
    ? Math.min(75, hiddennessEstimate.score)
    : hiddennessEstimate.score

  const eligibilityScore = opportunity.eligibility.length
    ? opportunity.entityRequirements.length
      ? 55
      : 80
    : 35
  const participationScore = incompatibleParticipation || incompatibleTeam
    ? 0
    : opportunity.participationModes.includes('unknown')
      ? 50
      : 85
  const winFactors = [
    factor('Hiddenness', hiddenness * 0.5, `Observable Hiddenness is ${hiddenness}.`),
    factor('Eligibility evidence', eligibilityScore * 0.2, opportunity.eligibility.length ? 'Eligibility evidence exists.' : 'Eligibility is unknown.'),
    factor('Participation path', participationScore * 0.15, incompatibleParticipation ? 'Current participation mode conflicts with the profile.' : 'A participation path exists or remains unknown.'),
    factor('Project leverage', projectReuseScore * 0.1, projects.length ? `${projects.length} matching project(s).` : 'No matching project.'),
    factor('Extraction confidence', opportunity.confidence * 0.05, `${opportunity.confidence}/100 source extraction confidence.`),
  ]
  const winSignal = clamp(winFactors.reduce((total, item) => total + item.impact, 0))

  const explorationScore = wildcard.length ? 100 : direct.length ? 55 : 25
  const deliverableScore = clamp(opportunity.deliverables.length * 30 + opportunity.evidence.length * 10)
  const rewardScore = rewardMatch ? 100 : opportunity.reward.trim() ? 35 : 10
  const strategicFactors = [
    factor('Reusable leverage', projectReuseScore * 0.4, projects.length ? projects.map((project) => project.name).join(', ') : 'No existing project leverage.'),
    factor('Reward alignment', rewardScore * 0.2, rewardMatch ? 'Matches declared reward preference.' : 'Reward has weak or unknown alignment.'),
    factor('Learning or portfolio', explorationScore * 0.2, wildcard.length ? 'Creates deliberate exploration value.' : 'Mostly reinforces existing domains.'),
    factor('Durable deliverable', deliverableScore * 0.1, `${opportunity.deliverables.length} documented deliverable(s).`),
    factor('Evidence confidence', opportunity.confidence * 0.1, `${opportunity.confidence}/100 extraction confidence.`),
  ]
  const strategicValue = clamp(strategicFactors.reduce((total, item) => total + item.impact, 0))

  const deadline = deadlineState(opportunity, now)
  const availableHours = profile.weeklyHours * deadline.weeks
  const effortUnknown = opportunity.effortHours <= 0
    || opportunity.unknowns.some((unknown) => /effort.*(?:unknown|unavailable|not (?:provided|stated))|no .*effort/i.test(unknown))
  const effortRatio = effortUnknown
    ? 1
    : availableHours > 0 ? opportunity.effortHours / availableHours : 2
  const effortFit = deadline.expired
    ? 0
    : effortUnknown
      ? 45
    : effortRatio <= 0.75
      ? 100
      : effortRatio >= 1.5
        ? 0
        : clamp(((1.5 - effortRatio) / 0.75) * 100)
  const effortFactors = [
    factor(
      'Estimated effort',
      effortUnknown ? -20 : -opportunity.effortHours,
      effortUnknown ? 'No reliable effort estimate; a neutral-conservative score is used.' : `${opportunity.effortHours} total estimated hours.`,
    ),
    factor('Available capacity', availableHours, `${Math.round(availableHours)} hours available across ${deadline.weeks.toFixed(1)} week(s).`),
    factor('Deadline confidence', opportunity.deadline ? 0 : -12, opportunity.deadline ? 'Deadline supplied.' : 'No deadline; two weeks assumed.'),
  ]

  const burdenRisk = opportunity.applicationBurden === 'high'
    ? 18
    : opportunity.applicationBurden === 'medium'
      ? 8
      : 0
  const urgencyRisk = deadline.days !== null && deadline.days <= 7
    ? 18
    : deadline.days !== null && deadline.days <= 14
      ? 8
      : 0
  const constraint = profile.learnedConstraintWeights
  const constraintRisk = (
    (effortRatio > 0.75 ? constraint.time ?? 0 : 0)
    + (!rewardMatch ? constraint.reward ?? 0 : 0)
    + (!opportunity.eligibility.length || opportunity.entityRequirements.length ? constraint.eligibility ?? 0 : 0)
    + (incompatibleParticipation || incompatibleTeam ? constraint.team ?? 0 : 0)
    + (deadline.days !== null && deadline.days <= 14 ? constraint.deadline ?? 0 : 0)
    + (opportunity.confidence < 70 || opportunity.provenance.evidenceRole !== 'primary' ? constraint['source-trust'] ?? 0 : 0)
  )
  const riskFactors = [
    factor('Extraction uncertainty', (100 - opportunity.confidence) * 0.35, `${opportunity.confidence}/100 extraction confidence.`),
    factor('Material unknowns', opportunity.unknowns.length * 8, `${opportunity.unknowns.length} unresolved unknown(s).`),
    factor('Application burden', burdenRisk, opportunity.applicationBurden),
    factor('Unknown effort', effortUnknown ? 14 : 0, effortUnknown ? 'Effort must be estimated before committing.' : 'A source-grounded effort estimate exists.'),
    factor('Effort pressure', effortFit < 50 ? 18 : 0, effortFit < 50 ? 'Estimated effort strains available capacity.' : 'Effort is within available capacity.'),
    factor('Participation mismatch', incompatibleParticipation || incompatibleTeam ? 22 : 0, incompatibleParticipation ? 'Participation path conflicts with the profile.' : 'No confirmed mismatch.'),
    factor('Deadline pressure', opportunity.deadline ? urgencyRisk : 10, opportunity.deadline ? `${deadline.days?.toFixed(0)} days remain.` : 'Deadline is unknown.'),
    factor('Learned constraints', Math.min(25, constraintRisk), constraintRisk ? 'Derived from structured pass reasons.' : 'No learned constraint penalty.'),
  ]
  const risk = clamp(riskFactors.reduce((total, item) => total + item.impact, 0))

  const verificationStatus: OpportunityEvaluation['verificationStatus'] = deadline.expired
    ? 'closed'
    : opportunity.provenance.mode === 'illustrative'
      || opportunity.confidence < 60
      || effortUnknown
      || incompatibleParticipation
      || incompatibleTeam
      || opportunity.unknowns.some((unknown) => /eligib|entity|deadline|partnership/i.test(unknown))
      ? 'needs-review'
      : 'verified'
  const overall = clamp(
    fit * 0.3
      + winSignal * 0.2
      + strategicValue * 0.2
      + effortFit * 0.15
      + opportunity.confidence * 0.1
      + (100 - risk) * 0.05,
  )

  const reasonsFor = [
    direct.length
      ? `Strong overlap with ${direct.slice(0, 3).join(', ')}.`
      : wildcard.length
        ? `A plausible wildcard in ${wildcard.slice(0, 2).join(', ')}.`
        : 'The domain is not an obvious fit, which may create a differentiated angle.',
    projects.length
      ? `${projects[0].name} gives you reusable product or domain leverage.`
      : skillMatches.length
        ? `Your documented ${skillMatches.slice(0, 3).join(', ')} experience matches the requested work.`
        : 'No existing project is being claimed as leverage.',
    hiddenness >= 70
      ? 'Observable discovery signals suggest a less saturated path.'
      : 'The opportunity is relatively visible, so differentiation matters.',
  ]
  const reasonsAgainst = [
    deadline.expired
      ? 'The documented deadline has passed.'
      : effortUnknown
        ? 'Effort is unknown, so the opportunity cannot receive a high commitment verdict yet.'
      : effortFit < 55
        ? `Estimated effort strains the available ${Math.round(availableHours)}-hour capacity.`
        : `Estimated effort fits within roughly ${Math.round(availableHours)} available hours.`,
    opportunity.participants === null
      ? 'Applicant volume is unknown and does not improve the win signal.'
      : 'Visible participation is only a proxy for actual competition.',
    incompatibleParticipation
      ? `Participation currently expects ${opportunity.participationModes.join(' or ')}.`
      : opportunity.unknowns[0] ?? 'Eligibility and source details still need a final human check.',
  ]

  return {
    opportunityId: opportunity.id,
    fit,
    winSignal,
    hiddenness,
    hiddennessConfidence,
    hiddennessFactors: hiddennessEstimate.factors,
    strategicValue,
    effortFit,
    risk,
    overall,
    confidence: opportunity.confidence,
    verdict: getVerdict(overall, risk, effortFit, verificationStatus),
    reasonsFor,
    reasonsAgainst,
    matchedProjectIds: projects.slice(0, 3).map((project) => project.id),
    verificationStatus,
    fitFactors,
    winFactors,
    strategicFactors,
    effortFactors,
    riskFactors,
  }
}

function isWildcard(profile: BuilderProfile, opportunity: Opportunity) {
  const direct = intersect(profile.domains, opportunity.domains)
  const wildcard = intersect(profile.wildcardDomains, opportunity.domains)
  return direct.length === 0 && wildcard.length > 0
}

export function buildRadar(
  profile: BuilderProfile,
  opportunities: Opportunity[],
  feedback: FeedbackEvent[] = [],
  now = new Date(),
): RadarItem[] {
  const latestDecisions = new Map<string, FeedbackEvent>()
  for (const event of feedback) {
    if (event.kind === 'decision') latestDecisions.set(event.opportunityId, event)
  }
  const passed = new Set([...latestDecisions.values()]
    .filter((event) => event.action === 'passed')
    .map((event) => event.opportunityId))
  const candidatePool = opportunities.some((opportunity) => opportunity.provenance.mode === 'live')
    ? opportunities.filter((opportunity) => opportunity.provenance.mode === 'live')
    : opportunities
  const ranked = candidatePool
    .filter((opportunity) => !passed.has(opportunity.id))
    .filter((opportunity) => intersect(profile.noGoDomains, opportunity.domains).length === 0)
    .map((opportunity) => ({
      opportunity,
      evaluation: evaluateOpportunity(profile, opportunity, now),
    }))
    .filter(({ evaluation }) => evaluation.verificationStatus !== 'closed')
    .sort((left, right) => right.evaluation.overall - left.evaluation.overall)

  const selected: RadarItem[] = []
  const used = new Set<string>()
  const take = (
    bucket: RadarBucket,
    count: number,
    predicate: (item: (typeof ranked)[number]) => boolean,
    bucketMatch: RadarBucketMatch = 'exact',
  ) => {
    for (const item of ranked) {
      if (selected.filter((selectedItem) => selectedItem.bucket === bucket).length >= count) break
      if (used.has(item.opportunity.id) || !predicate(item)) continue
      selected.push({ ...item, bucket, bucketMatch })
      used.add(item.opportunity.id)
    }
  }

  take('practical', 2, ({ opportunity, evaluation }) =>
    !isWildcard(profile, opportunity) && evaluation.hiddenness < 75 && evaluation.effortFit >= 45)
  take('rare', 2, ({ opportunity, evaluation }) =>
    !isWildcard(profile, opportunity) && evaluation.hiddenness >= 68)
  take('wildcard', 1, ({ opportunity }) => isWildcard(profile, opportunity))

  const targets: Array<[RadarBucket, number]> = [['practical', 2], ['rare', 2], ['wildcard', 1]]
  for (const [bucket, target] of targets) take(bucket, target, () => true, 'closest')
  return selected.slice(0, 5)
}

export function createFeedback(
  opportunity: Opportunity,
  kind: FeedbackKind,
  action: FeedbackAction,
  reasonCode?: FeedbackReason,
  note?: string,
): FeedbackEvent {
  return {
    id: crypto.randomUUID(),
    opportunityId: opportunity.id,
    kind,
    action,
    reasonCode,
    note,
    domains: opportunity.domains,
    createdAt: new Date().toISOString(),
  }
}

export const verdictLabel: Record<Verdict, string> = {
  enter: 'Enter',
  investigate: 'Investigate',
  monitor: 'Monitor',
  recycle: 'Recycle the idea',
  ignore: 'Ignore',
  closed: 'Closed',
}
