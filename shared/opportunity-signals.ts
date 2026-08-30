import type { OpportunityCandidate, RawSignal, SourceSubscription } from './domain.js'

const strongTerms = [
  'applications open', 'submissions open', 'call for proposals', 'call for applications',
  'bounty', 'cash prize', 'grant programme', 'funding opportunity', 'convocatoria abierta',
]
const positiveTerms = [
  'apply', 'application', 'submission', 'deadline', 'prize', 'grant', 'award', 'reward',
  'challenge', 'competition', 'hackathon', 'funding', 'bounty', 'hardware kit', 'convocatoria',
  'premio', 'solicitud', 'fecha límite',
]
const closedTerms = [
  'applications closed', 'submissions closed', 'deadline has passed', 'challenge ended',
  'winner announced', 'convocatoria cerrada', 'plazo cerrado',
]

const countMatches = (value: string, terms: string[]) => terms.filter((term) => value.includes(term.toLowerCase()))

export function promoteSignal(signal: RawSignal, subscription: SourceSubscription): RawSignal {
  const value = `${signal.title}\n${signal.summary}\n${signal.sourceText ?? ''}`.toLowerCase()
  const configuredPositive = countMatches(value, subscription.positiveTerms)
  const standardPositive = countMatches(value, positiveTerms)
  const strong = countMatches(value, strongTerms)
  const closed = countMatches(value, [...closedTerms, ...subscription.negativeTerms])
  const uniqueSignals = [...new Set([...configuredPositive, ...standardPositive])]
  const deadlineSignal = /\b(deadline|closes?|ends?|fecha límite)\b.{0,80}\b(20\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(value)
  const reasons = [
    ...strong.map((term) => `Strong opportunity phrase: ${term}`),
    ...uniqueSignals.slice(0, 5).map((term) => `Opportunity signal: ${term}`),
    ...(deadlineSignal ? ['Explicit deadline language'] : []),
  ]
  const score = Math.max(0, Math.min(100,
    subscription.trust * 0.35
    + strong.length * 28
    + uniqueSignals.length * 10
    + (deadlineSignal ? 12 : 0)
    - closed.length * 45,
  ))
  if (closed.length) {
    return { ...signal, promotionStatus: 'suppressed', preliminaryScore: score, promotionReasons: reasons, suppressionReasons: closed.map((term) => `Closed or excluded: ${term}`) }
  }
  if (strong.length || uniqueSignals.length >= 2 || (uniqueSignals.length >= 1 && deadlineSignal)) {
    return { ...signal, promotionStatus: 'promoted', preliminaryScore: score, promotionReasons: reasons, suppressionReasons: [] }
  }
  return {
    ...signal,
    promotionStatus: uniqueSignals.length ? 'ambiguous' : 'suppressed',
    preliminaryScore: score,
    promotionReasons: reasons,
    suppressionReasons: uniqueSignals.length ? ['Insufficient independent opportunity signals'] : ['No opportunity signal found'],
  }
}

export function candidateFromSignal(signal: RawSignal, subscription: SourceSubscription): OpportunityCandidate {
  return {
    id: `candidate-${signal.id}`,
    connector: signal.adapterId,
    externalId: signal.externalId,
    canonicalUrl: signal.canonicalUrl,
    title: signal.title,
    organizer: subscription.label,
    summary: signal.summary,
    deadline: null,
    reward: '',
    region: 'global',
    language: subscription.languages[0] ?? 'English',
    tags: subscription.positiveTerms.slice(0, 8),
    participationModes: ['unknown'],
    sourceText: (signal.sourceText ?? signal.summary).slice(0, 12_000),
    discoveredAt: signal.observedAt,
    lastSeenAt: signal.observedAt,
    status: 'new',
    sourcePackId: signal.sourcePackId,
    sourceSubscriptionId: signal.subscriptionId,
    firstSeenAt: signal.observedAt,
    promotionReasons: signal.promotionReasons,
    preliminaryHiddenness: Math.round(Math.max(0, Math.min(100,
      38 + subscription.trust * 0.25 + (signal.changeKind === 'new' ? 12 : 4),
    ))),
  }
}
