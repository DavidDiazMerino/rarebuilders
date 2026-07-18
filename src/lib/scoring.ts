import type {
  BuilderProfile,
  FeedbackAction,
  FeedbackEvent,
  Opportunity,
  OpportunityEvaluation,
  RadarBucket,
  RadarBucketMatch,
  RadarItem,
  Verdict,
} from '../../shared/domain'
import { estimateHiddenness } from '../../shared/hiddenness'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
export const normalizeDomainSignal = (value: string) => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9+#.]+/g, '-')
  .replace(/^-+|-+$/g, '')

const intersect = (left: string[], right: string[]) => {
  const normalizedRight = new Set(right.map(normalizeDomainSignal))
  return left.filter((item) => normalizedRight.has(normalizeDomainSignal(item)))
}

function domainAffinity(profile: BuilderProfile, opportunity: Opportunity) {
  const direct = intersect(profile.domains, opportunity.domains)
  const wildcard = intersect(profile.wildcardDomains, opportunity.domains)
  const blocked = intersect(profile.noGoDomains, opportunity.domains)
  const learned = opportunity.domains.reduce(
    (total, domain) => total + (profile.learnedDomainWeights[normalizeDomainSignal(domain)] ?? 0),
    0,
  )
  return { direct, wildcard, blocked, learned }
}

function rewardMatches(profile: BuilderProfile, opportunity: Opportunity) {
  const reward = opportunity.reward.toLowerCase()
  const signals: Record<BuilderProfile['rewardPreference'], string[]> = {
    money: ['$', '€', 'cash', 'prize', 'grant', 'bounty'],
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

function matchedProjects(profile: BuilderProfile, opportunity: Opportunity) {
  return profile.projects
    .map((project) => ({
      project,
      overlap: intersect([...project.domains, ...project.technologies.map((item) => item.toLowerCase())], opportunity.domains).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .map(({ project }) => project)
}

function feedbackModifier(opportunity: Opportunity, feedback: FeedbackEvent[]) {
  return latestFeedbackEvents(feedback).reduce((modifier, event) => {
    if (!intersect(event.domains, opportunity.domains).length) return modifier
    if (event.action === 'more-like-this') return modifier + 7
    if (event.action === 'saved') return modifier + 3
    if (event.action === 'entered') return modifier + 8
    if (event.action === 'rejected') return modifier - 10
    if (event.action === 'ignored') return modifier - 3
    return modifier
  }, 0)
}

function latestFeedbackEvents(feedback: FeedbackEvent[]) {
  const latest = new Map<string, FeedbackEvent>()
  for (const event of feedback) latest.set(event.opportunityId, event)
  return [...latest.values()]
}

function feedbackDelta(action: FeedbackAction) {
  return action === 'more-like-this'
    ? 5
    : action === 'saved' || action === 'entered'
      ? 2
      : action === 'rejected'
        ? -5
        : action === 'ignored'
          ? -2
          : 0
}

export function canonicalLearnedDomainWeights(weights: Record<string, number>) {
  const canonical: Record<string, number> = {}
  for (const [domain, weight] of Object.entries(weights)) {
    const key = normalizeDomainSignal(domain)
    if (!key) continue
    canonical[key] = Math.max(-20, Math.min(20, (canonical[key] ?? 0) + weight))
  }
  return canonical
}

export function learnedDomainWeightsFromFeedback(feedback: FeedbackEvent[]) {
  const learned: Record<string, number> = {}
  for (const event of latestFeedbackEvents(feedback)) {
    const delta = feedbackDelta(event.action)
    for (const domain of new Set(event.domains.map(normalizeDomainSignal).filter(Boolean))) {
      learned[domain] = Math.max(-20, Math.min(20, (learned[domain] ?? 0) + delta))
    }
  }
  return learned
}

function getVerdict(overall: number, risk: number, effortFit: number): Verdict {
  if (overall >= 76 && risk < 66 && effortFit >= 55) return 'enter'
  if (overall >= 64) return 'investigate'
  if (overall >= 52) return 'monitor'
  if (overall >= 40) return 'recycle'
  return 'ignore'
}

export function evaluateOpportunity(
  profile: BuilderProfile,
  opportunity: Opportunity,
  feedback: FeedbackEvent[] = [],
): OpportunityEvaluation {
  const { direct, wildcard, blocked, learned } = domainAffinity(profile, opportunity)
  const hiddenness = estimateHiddenness(opportunity)
  const projects = matchedProjects(profile, opportunity)
  const documentedSkills = [
    ...profile.fastSkills,
    ...profile.careerProfile.skills.map((skill) => skill.name),
    ...profile.projects.flatMap((project) => project.technologies),
  ]
  const skillMatches = intersect(documentedSkills, opportunity.requiredSkills)
  const regionMatch = profile.regions.includes('global') || profile.regions.includes(opportunity.region)
  const languageMatch = profile.languages.includes(opportunity.language)
  const projectLeverage = Math.min(20, projects.length * 9)
  const skillLeverage = Math.min(16, skillMatches.length * 5)
  const rewardFit = rewardMatches(profile, opportunity) ? 7 : 0
  const incompatibleTeam = teamMismatch(profile, opportunity)
  const participationMismatch = !opportunity.participationModes.includes('unknown')
    && !opportunity.participationModes.some((mode) => profile.participationModes.includes(mode))
  const burdenRisk = opportunity.applicationBurden === 'high'
    ? 16
    : opportunity.applicationBurden === 'medium'
      ? 7
      : 0

  const fit = clamp(
    24
      + direct.length * 16
      + wildcard.length * 7
      + projectLeverage
      + skillLeverage
      + (regionMatch ? 7 : 0)
      + (languageMatch ? 6 : 0)
      + rewardFit
      - blocked.length * 35
      - (incompatibleTeam ? 18 : 0)
      - (participationMismatch ? 22 : 0)
      + learned,
  )

  const participantSignal = opportunity.participants === null
    ? 14
    : opportunity.participants < 75
      ? 31
      : opportunity.participants < 250
        ? 24
        : opportunity.participants < 1000
          ? 16
          : opportunity.participants < 5000
            ? 8
            : 1

  const winSignal = clamp(
    hiddenness.score * 0.43
      + participantSignal
      + projectLeverage * 0.7
      + opportunity.confidence * 0.08,
  )
  const effortFit = clamp(100 - Math.max(0, opportunity.effortHours - profile.weeklyHours) * 6)
  const risk = clamp(
    (100 - opportunity.confidence) * 0.5
      + opportunity.unknowns.length * 8
      + burdenRisk
      + (effortFit < 50 ? 18 : 0)
      + (incompatibleTeam ? 18 : 0)
      + (participationMismatch ? 18 : 0)
      + (opportunity.deadline ? 0 : 12),
  )
  const modifier = feedbackModifier(opportunity, feedback)
  const overall = clamp(
    fit * 0.3
      + winSignal * 0.23
      + opportunity.strategicValueBase * 0.22
      + effortFit * 0.17
      + opportunity.confidence * 0.08
      - risk * 0.08
      + modifier,
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
        : 'A fresh artifact could still create portfolio value.',
    hiddenness.score >= 70
      ? 'The discovery path is less saturated than a mainstream directory.'
      : 'The opportunity has enough strategic value to offset its visibility.',
  ]
  const reasonsAgainst = [
    opportunity.effortHours > profile.weeklyHours
      ? `Estimated effort exceeds this week's ${profile.weeklyHours}-hour budget.`
      : 'The effort fits the declared weekly budget, but submission overhead still matters.',
    opportunity.participants !== null && opportunity.participants > 5000
      ? 'Visible participation is extremely high.'
      : opportunity.participants === null
        ? 'Applicant volume is unknown, so the win signal has lower confidence.'
        : 'Visible participation is only a proxy for actual competition.',
    participationMismatch
      ? `Participation currently expects ${opportunity.participationModes.join(' or ')}; you need a partner or entity path.`
      : opportunity.unknowns[0] ?? 'Eligibility and source details still need a final human check.',
  ]

  return {
    opportunityId: opportunity.id,
    fit,
    winSignal,
    hiddenness: hiddenness.score,
    hiddennessConfidence: hiddenness.confidence,
    hiddennessFactors: hiddenness.factors,
    strategicValue: opportunity.strategicValueBase,
    effortFit,
    risk,
    overall,
    confidence: opportunity.confidence,
    verdict: getVerdict(overall, risk, effortFit),
    reasonsFor,
    reasonsAgainst,
    matchedProjectIds: projects.slice(0, 3).map((project) => project.id),
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
): RadarItem[] {
  const latestFeedback = new Map<string, FeedbackEvent>()
  for (const event of feedback) latestFeedback.set(event.opportunityId, event)
  const rejected = new Set([...latestFeedback.values()]
    .filter((event) => event.action === 'rejected' || event.action === 'ignored')
    .map((event) => event.opportunityId))
  const ranked = opportunities
    .filter((opportunity) => !rejected.has(opportunity.id))
    .filter((opportunity) => intersect(profile.noGoDomains, opportunity.domains).length === 0)
    .map((opportunity) => ({
      opportunity,
      evaluation: evaluateOpportunity(profile, opportunity, feedback),
    }))
    .sort((a, b) => b.evaluation.overall - a.evaluation.overall)

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
    !isWildcard(profile, opportunity) && evaluation.hiddenness < 75 && evaluation.effortFit >= 45,
  )
  take('rare', 2, ({ opportunity, evaluation }) =>
    !isWildcard(profile, opportunity) && evaluation.hiddenness >= 68,
  )
  take('wildcard', 1, ({ opportunity }) => isWildcard(profile, opportunity))

  const targets: Array<[RadarBucket, number]> = [['practical', 2], ['rare', 2], ['wildcard', 1]]
  for (const [bucket, target] of targets) {
    take(bucket, target, () => true, 'closest')
  }

  return selected.slice(0, 5)
}

export function createFeedback(
  opportunity: Opportunity,
  action: FeedbackAction,
  reason?: string,
): FeedbackEvent {
  return {
    id: crypto.randomUUID(),
    opportunityId: opportunity.id,
    action,
    reason,
    domains: opportunity.domains,
    createdAt: new Date().toISOString(),
  }
}

export function applyFeedbackLearning(profile: BuilderProfile, event: FeedbackEvent): BuilderProfile {
  const delta = feedbackDelta(event.action)
  const learnedDomainWeights = canonicalLearnedDomainWeights(profile.learnedDomainWeights)
  for (const domain of new Set(event.domains.map(normalizeDomainSignal).filter(Boolean))) {
    learnedDomainWeights[domain] = Math.max(
      -20,
      Math.min(20, (learnedDomainWeights[domain] ?? 0) + delta),
    )
  }
  return { ...profile, learnedDomainWeights }
}

export const verdictLabel: Record<Verdict, string> = {
  enter: 'Enter',
  investigate: 'Investigate',
  monitor: 'Monitor',
  recycle: 'Recycle the idea',
  ignore: 'Ignore',
}
