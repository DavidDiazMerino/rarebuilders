import type { Opportunity } from './domain.js'

export type HiddennessInput = Pick<
  Opportunity,
  'sourceKind' | 'sourceLabel' | 'sourceUrl' | 'region' | 'language' | 'participants'
>

export type HiddennessFactor = {
  label: string
  impact: number
  evidence: string
}

export type HiddennessEstimate = {
  score: number
  confidence: number
  factors: HiddennessFactor[]
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const mainstreamHosts = [
  'challenge.gov',
  'devfolio.co',
  'devpost.com',
  'f6s.com',
  'grants.gov',
  'kaggle.com',
  'unstop.com',
]

function hostname(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isMainstreamAggregator(host: string) {
  return mainstreamHosts.some((knownHost) => host === knownHost || host.endsWith(`.${knownHost}`))
}

function sourceFactor(input: HiddennessInput, host: string): HiddennessFactor {
  if (isMainstreamAggregator(host)) {
    return {
      label: 'Discovery channel',
      impact: -30,
      evidence: `${host} is a high-visibility opportunity aggregator.`,
    }
  }

  const label = input.sourceLabel.toLowerCase()
  if (input.sourceKind === 'newsletter' || label.includes('newsletter')) {
    return {
      label: 'Discovery channel',
      impact: 20,
      evidence: 'The source is a newsletter rather than a mainstream directory.',
    }
  }
  if (input.sourceKind === 'community' || /discord|slack|community/.test(label)) {
    return {
      label: 'Discovery channel',
      impact: 22,
      evidence: 'The source is distributed through a community channel.',
    }
  }
  if (input.sourceKind === 'github' || label.includes('github')) {
    return {
      label: 'Discovery channel',
      impact: 18,
      evidence: 'The opportunity was found through GitHub rather than a dedicated contest directory.',
    }
  }
  if (/local pdf|pdf pattern/.test(label)) {
    return {
      label: 'Discovery channel',
      impact: 15,
      evidence: 'The source is a locally distributed document.',
    }
  }
  if (input.sourceKind === 'official') {
    return {
      label: 'Discovery channel',
      impact: -5,
      evidence: 'The source is an official public page with direct visibility.',
    }
  }
  return {
    label: 'Discovery channel',
    impact: 4,
    evidence: 'The source is outside the known high-visibility aggregators.',
  }
}

function participantFactor(participants: number | null): HiddennessFactor {
  if (participants === null) {
    return {
      label: 'Visible participation',
      impact: 0,
      evidence: 'Participant volume is unknown, so it does not increase Hiddenness.',
    }
  }
  if (participants <= 50) {
    return {
      label: 'Visible participation',
      impact: 18,
      evidence: `${participants.toLocaleString('en')} visible participants is a small audience.`,
    }
  }
  if (participants <= 150) {
    return {
      label: 'Visible participation',
      impact: 12,
      evidence: `${participants.toLocaleString('en')} visible participants suggests limited reach.`,
    }
  }
  if (participants <= 500) {
    return {
      label: 'Visible participation',
      impact: 6,
      evidence: `${participants.toLocaleString('en')} visible participants suggests moderate reach.`,
    }
  }
  if (participants <= 2_000) {
    return {
      label: 'Visible participation',
      impact: 0,
      evidence: `${participants.toLocaleString('en')} visible participants is neither scarce nor mass-market.`,
    }
  }
  if (participants <= 5_000) {
    return {
      label: 'Visible participation',
      impact: -6,
      evidence: `${participants.toLocaleString('en')} visible participants indicates broad reach.`,
    }
  }
  return {
    label: 'Visible participation',
    impact: -20,
    evidence: `${participants.toLocaleString('en')} visible participants indicates a highly visible opportunity.`,
  }
}

export function estimateHiddenness(input: HiddennessInput): HiddennessEstimate {
  const host = hostname(input.sourceUrl)
  const factors: HiddennessFactor[] = [
    sourceFactor(input, host),
    participantFactor(input.participants),
  ]

  if (input.region.trim().toLowerCase() === 'global') {
    factors.push({
      label: 'Geographic reach',
      impact: -6,
      evidence: 'Global eligibility expands the visible audience.',
    })
  } else if (input.region.trim()) {
    factors.push({
      label: 'Geographic reach',
      impact: 7,
      evidence: `${input.region} scope narrows the likely audience.`,
    })
  }

  if (input.language.trim() && input.language.trim().toLowerCase() !== 'english') {
    factors.push({
      label: 'Language reach',
      impact: 5,
      evidence: `${input.language} distribution narrows the default English-language audience.`,
    })
  }

  const confidence = clamp(
    50
      + (host ? 15 : 0)
      + (input.participants === null ? 0 : 20)
      + (input.region.trim() ? 8 : 0)
      + (input.language.trim() ? 7 : 0),
  )

  return {
    score: clamp(45 + factors.reduce((total, factor) => total + factor.impact, 0)),
    confidence,
    factors: factors.sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact)),
  }
}
