import type {
  CareerProfile,
  ProfileMemoryItem,
  ProfileMemoryReviewStatus,
  ProfileMemorySource,
  ProfileSummary,
} from '../../shared/domain'

type NewProfileMemoryItem = Pick<
  ProfileMemoryItem,
  'kind' | 'title' | 'detail' | 'tags' | 'source' | 'evidence'
>

type CreationContext = {
  id?: string
  now?: string
}

type ReviewContext = {
  note?: string
  now?: string
}

type ImportContext = {
  now?: string
  id?: (index: number) => string
}

export function createProfileMemoryItem(
  input: NewProfileMemoryItem,
  context: CreationContext = {},
): ProfileMemoryItem {
  const now = context.now ?? new Date().toISOString()
  return {
    ...input,
    id: context.id ?? crypto.randomUUID(),
    reviewStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  }
}

export function reviewProfileMemoryItem(
  item: ProfileMemoryItem,
  reviewStatus: Extract<ProfileMemoryReviewStatus, 'approved' | 'rejected'>,
  context: ReviewContext = {},
): ProfileMemoryItem {
  const now = context.now ?? new Date().toISOString()
  return {
    ...item,
    reviewStatus,
    reviewNote: context.note?.trim() || undefined,
    reviewedAt: now,
    updatedAt: now,
  }
}

export function profileSummaryToApprovedMemory(
  summary: ProfileSummary,
  source: ProfileMemorySource,
  context: ImportContext = {},
): ProfileMemoryItem[] {
  const now = context.now ?? new Date().toISOString()
  const candidates: NewProfileMemoryItem[] = [
    ...summary.fastSkills.map((skill) => ({
      kind: 'capability' as const,
      title: skill,
      detail: 'Capability extracted from context selected and reviewed by the builder.',
      tags: summary.domains,
      source,
      evidence: [],
    })),
    ...summary.projects.map((project) => ({
      kind: project.status === 'idea' ? 'idea' as const : 'asset' as const,
      title: project.name,
      detail: project.summary,
      tags: [...new Set([...project.domains, ...project.technologies])],
      source,
      evidence: project.reusableAssets,
    })),
    ...summary.noGoDomains.map((domain) => ({
      kind: 'preference' as const,
      title: `Avoid ${domain}`,
      detail: 'Explicit no-go signal extracted from reviewed builder context.',
      tags: [domain],
      source,
      evidence: [],
    })),
  ]

  return candidates.map((candidate, index) => ({
    ...createProfileMemoryItem(candidate, {
      id: context.id?.(index),
      now,
    }),
    reviewStatus: 'approved',
    reviewedAt: now,
  }))
}

export function careerProfileToApprovedMemory(
  career: CareerProfile,
  source: ProfileMemorySource,
  context: ImportContext = {},
): ProfileMemoryItem[] {
  const now = context.now ?? new Date().toISOString()
  const candidates: NewProfileMemoryItem[] = [
    ...career.skills.map((skill) => ({
      kind: 'capability' as const,
      title: skill.name,
      detail: `CV-derived capability with ${skill.confidence}% extraction confidence.`,
      tags: [skill.name],
      source,
      evidence: skill.evidence,
    })),
    ...career.achievements.map((achievement) => ({
      kind: 'achievement' as const,
      title: achievement,
      detail: 'Achievement retained from the reviewed professional profile.',
      tags: [],
      source,
      evidence: [],
    })),
  ]

  return candidates.map((candidate, index) => ({
    ...createProfileMemoryItem(candidate, {
      id: context.id?.(index),
      now,
    }),
    reviewStatus: 'approved',
    reviewedAt: now,
  }))
}

function memoryIdentity(item: ProfileMemoryItem) {
  const sourceIdentity = item.source.reference ?? item.source.label
  return [item.kind, item.title.trim().toLowerCase(), item.source.kind, sourceIdentity.trim().toLowerCase()].join('::')
}

export function mergeProfileMemoryItems(
  existing: ProfileMemoryItem[],
  incoming: ProfileMemoryItem[],
): ProfileMemoryItem[] {
  const items = new Map(existing.map((item) => [memoryIdentity(item), item]))
  for (const item of incoming) items.set(memoryIdentity(item), item)
  return [...items.values()]
}
