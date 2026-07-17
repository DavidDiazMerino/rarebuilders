import type {
  BuilderProfile,
  FeedbackAction,
  FeedbackEvent,
  Opportunity,
  OpportunityEvaluation,
  RadarBucket,
  RadarItem,
  Verdict,
} from '../../shared/domain'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
const intersect = (left: string[], right: string[]) => left.filter((item) => right.includes(item))

function domainAffinity(profile: BuilderProfile, opportunity: Opportunity) {
  const direct = intersect(profile.domains, opportunity.domains)
  const wildcard = intersect(profile.wildcardDomains, opportunity.domains)
  const blocked = intersect(profile.noGoDomains, opportunity.domains)
  const learned = opportunity.domains.reduce(
    (total, domain) => total + (profile.learnedDomainWeights[domain] ?? 0),
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
  return feedback.reduce((modifier, event) => {
    if (!event.domains.some((domain) => opportunity.domains.includes(domain))) return modifier
    if (event.action === 'more-like-this') return modifier + 7
    if (event.action === 'saved') return modifier + 3
    if (event.action === 'entered') return modifier + 8
    if (event.action === 'rejected') return modifier - 10
    if (event.action === 'ignored') return modifier - 3
    return modifier
  }, 0)
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
  const projects = matchedProjects(profile, opportunity)
  const regionMatch = profile.regions.includes('global') || profile.regions.includes(opportunity.region)
  const languageMatch = profile.languages.includes(opportunity.language)
  const projectLeverage = Math.min(20, projects.length * 9)
  const rewardFit = rewardMatches(profile, opportunity) ? 7 : 0
  const incompatibleTeam = teamMismatch(profile, opportunity)

  const fit = clamp(
    24
      + direct.length * 16
      + wildcard.length * 7
      + projectLeverage
      + (regionMatch ? 7 : 0)
      + (languageMatch ? 6 : 0)
      + rewardFit
      - blocked.length * 35
      - (incompatibleTeam ? 18 : 0)
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
    opportunity.hiddennessBase * 0.43
      + participantSignal
      + projectLeverage * 0.7
      + opportunity.confidence * 0.08,
  )
  const effortFit = clamp(100 - Math.max(0, opportunity.effortHours - profile.weeklyHours) * 6)
  const risk = clamp(
    (100 - opportunity.confidence) * 0.5
      + opportunity.unknowns.length * 8
      + (effortFit < 50 ? 18 : 0)
      + (incompatibleTeam ? 18 : 0)
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
      : 'A fresh artifact could still create portfolio value.',
    opportunity.hiddennessBase >= 70
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
    opportunity.unknowns[0] ?? 'Eligibility and source details still need a final human check.',
  ]

  return {
    opportunityId: opportunity.id,
    fit,
    winSignal,
    hiddenness: opportunity.hiddennessBase,
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
  const rejected = new Set(
    feedback
      .filter((event) => event.action === 'rejected' || event.action === 'ignored')
      .map((event) => event.opportunityId),
  )
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
  ) => {
    for (const item of ranked) {
      if (selected.filter((selectedItem) => selectedItem.bucket === bucket).length >= count) break
      if (used.has(item.opportunity.id) || !predicate(item)) continue
      selected.push({ ...item, bucket })
      used.add(item.opportunity.id)
    }
  }

  take('practical', 2, ({ opportunity, evaluation }) =>
    !isWildcard(profile, opportunity) && opportunity.hiddennessBase < 75 && evaluation.effortFit >= 45,
  )
  take('rare', 2, ({ opportunity }) =>
    !isWildcard(profile, opportunity) && opportunity.hiddennessBase >= 68,
  )
  take('wildcard', 1, ({ opportunity }) => isWildcard(profile, opportunity))

  const targets: Array<[RadarBucket, number]> = [['practical', 2], ['rare', 2], ['wildcard', 1]]
  for (const [bucket, target] of targets) {
    take(bucket, target, () => true)
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
  const delta = event.action === 'more-like-this'
    ? 5
    : event.action === 'saved' || event.action === 'entered'
      ? 2
      : event.action === 'rejected'
        ? -5
        : event.action === 'ignored'
          ? -2
          : 0
  const learnedDomainWeights = { ...profile.learnedDomainWeights }
  for (const domain of event.domains) {
    learnedDomainWeights[domain] = Math.max(-20, Math.min(20, (learnedDomainWeights[domain] ?? 0) + delta))
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
