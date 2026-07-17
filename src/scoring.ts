export type UserProfile = {
  domains: string[]
  appetite: 'safe' | 'balanced' | 'weird'
  preferredReward: 'money' | 'visibility' | 'learning' | 'access'
  weeklyHours: number
  regions: string[]
  wildcardMode: boolean
}

export type Opportunity = {
  id: string
  title: string
  source: string
  region: string
  language: string
  deadline: string
  participants: number | null
  reward: string
  domains: string[]
  effortHours: number
  hiddenness: number
  strategicValue: number
  notes: string
  merinoLabsAngle: string
  suggestedBuild: string
}

export type OpportunityScore = Opportunity & {
  fitScore: number
  winSignal: number
  effortFit: number
  overall: number
  reasons: string[]
}

const intersection = (a: string[], b: string[]) => a.filter((item) => b.includes(item))

export function scoreOpportunity(profile: UserProfile, opportunity: Opportunity): OpportunityScore {
  const sharedDomains = intersection(profile.domains, opportunity.domains)
  const domainFit = Math.min(55, sharedDomains.length * 18)
  const regionFit = profile.regions.includes(opportunity.region) || profile.regions.includes('global') ? 10 : 0
  const wildcardBonus = profile.wildcardMode && opportunity.domains.some((domain) => ['biotech', 'hardware', 'climate', 'space'].includes(domain)) ? 14 : 0
  const fitScore = Math.min(100, 25 + domainFit + regionFit + wildcardBonus)

  const participantSignal = opportunity.participants === null
    ? 18
    : opportunity.participants < 100
      ? 34
      : opportunity.participants < 800
        ? 24
        : opportunity.participants < 5000
          ? 12
          : 3
  const winSignal = Math.min(100, Math.round(opportunity.hiddenness * 0.48 + participantSignal + (opportunity.strategicValue * 0.18)))

  const effortFit = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, opportunity.effortHours - profile.weeklyHours) * 6)))

  const appetiteMultiplier = profile.appetite === 'weird'
    ? 1.12
    : profile.appetite === 'safe'
      ? 0.94
      : 1

  const overall = Math.round(
    (fitScore * 0.36 + winSignal * 0.29 + opportunity.strategicValue * 0.22 + effortFit * 0.13) * appetiteMultiplier,
  )

  const reasons = [
    sharedDomains.length ? `Encaja por ${sharedDomains.join(', ')}` : 'No encaja por dominio obvio: revisar como wildcard',
    opportunity.hiddenness > 70 ? 'Señal oculta: menos saturada que Devpost/Product Hunt' : 'Fuente visible: compensa solo si el valor estratégico es alto',
    opportunity.participants === null ? 'Participación no publicada: posible oportunidad opaca' : `${opportunity.participants.toLocaleString('en-US')} participantes estimados`,
    opportunity.effortHours <= profile.weeklyHours ? `Cabe en ${profile.weeklyHours}h/semana` : `Exige más de tu disponibilidad declarada`,
  ]

  return {
    ...opportunity,
    fitScore,
    winSignal,
    effortFit,
    overall: Math.min(100, overall),
    reasons,
  }
}

export const starterProfile: UserProfile = {
  domains: ['ai-agents', 'developer-tools', 'education', 'creative-tech'],
  appetite: 'weird',
  preferredReward: 'visibility',
  weeklyHours: 18,
  regions: ['global', 'europe', 'latam'],
  wildcardMode: true,
}

export const sampleOpportunities: Opportunity[] = [
  {
    id: 'openai-build-week',
    title: 'OpenAI Build Week',
    source: 'Devpost / OpenAI',
    region: 'global',
    language: 'English',
    deadline: '2026-07-21 17:00 PT',
    participants: 18500,
    reward: '$100k prize pool + OpenAI visibility',
    domains: ['ai-agents', 'developer-tools', 'education'],
    effortHours: 36,
    hiddenness: 12,
    strategicValue: 88,
    notes: 'Gigante y saturado, pero sirve como escaparate para lanzar RareBuilders y documentar Codex/GPT-5.6.',
    merinoLabsAngle: 'Merino Labs como laboratorio de software opinionado: menos ruido, más decisiones accionables para builders.',
    suggestedBuild: 'RareBuilders: perfilado + radar + scoring + estrategia de participación generada para cada oportunidad.',
  },
  {
    id: 'bio-maker-prize',
    title: 'BioMaker Microgrant: CRISPR field notebook challenge',
    source: 'Newsletter universitaria / foro biohacker',
    region: 'europe',
    language: 'English',
    deadline: '2026-08-03',
    participants: 70,
    reward: '€4k microgrant + lab mentorship',
    domains: ['biotech', 'education', 'hardware'],
    effortHours: 16,
    hiddenness: 86,
    strategicValue: 76,
    notes: 'No exige wet lab inicial: premia herramientas de documentación, seguridad y trazabilidad para experimentos educativos.',
    merinoLabsAngle: 'Rama Merino Labs “cosas físicas”: cuaderno CRISPR seguro, auditable y explicable para no expertos.',
    suggestedBuild: 'Un cuaderno de laboratorio asistido por IA que transforma protocolos en checklists seguros y bitácora reproducible.',
  },
  {
    id: 'watchface-hack',
    title: 'Open Wearables Watchface Challenge',
    source: 'Discord de firmware open source',
    region: 'global',
    language: 'English',
    deadline: '2026-07-30',
    participants: 43,
    reward: '$1k + device kit',
    domains: ['hardware', 'creative-tech', 'developer-tools'],
    effortHours: 10,
    hiddenness: 91,
    strategicValue: 68,
    notes: 'Pequeño, físico, raro y muy demoable. No es IA-first, pero puede ser un artefacto con personalidad.',
    merinoLabsAngle: 'Un reloj Merino Labs que muestra “oportunidades raras” como complicaciones: deadline, riesgo y próximo paso.',
    suggestedBuild: 'Watchface que convierte tu radar de oportunidades en una interfaz física mínima: hoy, mañana, wildcard.',
  },
  {
    id: 'latam-civic-ai',
    title: 'Civic AI LatAm municipal services challenge',
    source: 'PDF de convocatoria pública / X con poca tracción',
    region: 'latam',
    language: 'Spanish',
    deadline: '2026-08-12',
    participants: null,
    reward: '$8k + pilot conversation',
    domains: ['ai-agents', 'workflows', 'education'],
    effortHours: 22,
    hiddenness: 78,
    strategicValue: 72,
    notes: 'Convocatoria poco visible, idioma español, buen encaje para agentes documentales y automatización pública.',
    merinoLabsAngle: 'Software opinionado para funcionarios: menos formularios, más resolución guiada y trazable.',
    suggestedBuild: 'Agente que convierte normativas municipales en respuestas y checklists verificables para ciudadanos.',
  },
]

export function rankOpportunities(profile: UserProfile, opportunities: Opportunity[] = sampleOpportunities) {
  return opportunities
    .map((opportunity) => scoreOpportunity(profile, opportunity))
    .sort((a, b) => b.overall - a.overall)
}
