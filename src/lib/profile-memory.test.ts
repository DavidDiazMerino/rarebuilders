import { describe, expect, it } from 'vitest'
import { profileMemoryItemSchema } from '../../shared/domain'
import {
  createProfileMemoryItem,
  careerProfileToApprovedMemory,
  profileSummaryToApprovedMemory,
  mergeProfileMemoryItems,
  reviewProfileMemoryItem,
} from './profile-memory'

describe('profile memory', () => {
  it('accepts public web evidence as a first-class memory source', () => {
    const item = profileMemoryItemSchema.parse({
      id: 'published-work',
      kind: 'achievement',
      title: 'Published AGI Noel',
      detail: 'Externally listed published work.',
      tags: ['publishing'],
      source: {
        kind: 'web',
        label: 'Goodreads author page',
        reference: 'https://www.goodreads.com/author/list/62442010.David_Diaz_Merino',
      },
      evidence: ['One distinct published work is listed.'],
      reviewStatus: 'approved',
      createdAt: '2026-08-27T12:00:00.000Z',
      updatedAt: '2026-08-27T12:00:00.000Z',
      reviewedAt: '2026-08-27T12:00:00.000Z',
    })

    expect(item.source.kind).toBe('web')
  })

  it('creates a traceable review candidate without treating an inference as fact', () => {
    const item = createProfileMemoryItem({
      kind: 'idea',
      title: 'Reuse the opportunity dossier as a research product',
      detail: 'Potential product direction inferred from the RareBuilders repository.',
      tags: ['rarebuilders', 'research'],
      source: {
        kind: 'repository',
        label: 'docs/PRODUCT.md',
        reference: 'docs/PRODUCT.md:163',
      },
      evidence: ['The dossier separates facts, inferences and unknowns.'],
    }, {
      id: 'memory-1',
      now: '2026-08-27T10:00:00.000Z',
    })

    expect(item).toMatchObject({
      id: 'memory-1',
      kind: 'idea',
      reviewStatus: 'pending',
      source: {
        kind: 'repository',
        label: 'docs/PRODUCT.md',
        reference: 'docs/PRODUCT.md:163',
      },
      createdAt: '2026-08-27T10:00:00.000Z',
      updatedAt: '2026-08-27T10:00:00.000Z',
    })
  })

  it('records David’s explicit approval while preserving provenance', () => {
    const candidate = createProfileMemoryItem({
      kind: 'capability',
      title: 'Rapid TypeScript prototyping',
      detail: 'Can ship strict TypeScript product slices quickly.',
      tags: ['typescript'],
      source: {
        kind: 'github',
        label: 'Public GitHub repository',
        reference: 'https://github.com/example/repo',
      },
      evidence: ['Repository contains a tested React application.'],
    }, {
      id: 'memory-2',
      now: '2026-08-27T10:00:00.000Z',
    })

    const approved = reviewProfileMemoryItem(candidate, 'approved', {
      note: 'Sí, esto sí representa una ventaja real.',
      now: '2026-08-27T11:00:00.000Z',
    })

    expect(approved.reviewStatus).toBe('approved')
    expect(approved.reviewNote).toBe('Sí, esto sí representa una ventaja real.')
    expect(approved.reviewedAt).toBe('2026-08-27T11:00:00.000Z')
    expect(approved.source).toEqual(candidate.source)
    expect(approved.evidence).toEqual(candidate.evidence)
  })

  it('keeps rejected ideas as useful negative evidence instead of deleting them', () => {
    const candidate = createProfileMemoryItem({
      kind: 'idea',
      title: 'Generic productivity assistant',
      detail: 'A broad assistant without a specific personal edge.',
      tags: ['productivity'],
      source: { kind: 'system', label: 'RareBuilders suggestion' },
      evidence: [],
    }, {
      id: 'memory-3',
      now: '2026-08-27T10:00:00.000Z',
    })

    const rejected = reviewProfileMemoryItem(candidate, 'rejected', {
      note: 'Demasiado genérico.',
      now: '2026-08-27T11:00:00.000Z',
    })

    expect(rejected.reviewStatus).toBe('rejected')
    expect(rejected.reviewNote).toBe('Demasiado genérico.')
    expect(rejected.title).toBe(candidate.title)
  })

  it('turns a reviewed profile import into approved capabilities and reusable work with provenance', () => {
    const memories = profileSummaryToApprovedMemory({
      projects: [{
        name: 'Signal Atlas',
        summary: 'Maps niche opportunity sources.',
        domains: ['research'],
        technologies: ['TypeScript'],
        status: 'idea',
        reusableAssets: ['Source taxonomy'],
        sourceLabel: 'Imported notes',
      }],
      fastSkills: ['Opportunity research'],
      domains: ['research'],
      wildcardDomains: [],
      noGoDomains: ['generic directories'],
      technologies: ['TypeScript'],
      caveats: [],
    }, {
      kind: 'notes',
      label: 'Reviewed Markdown import',
      reference: 'ideas.md',
    }, {
      now: '2026-08-27T12:00:00.000Z',
      id: (index) => `imported-${index}`,
    })

    expect(memories).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'imported-0',
        kind: 'capability',
        title: 'Opportunity research',
        reviewStatus: 'approved',
        reviewedAt: '2026-08-27T12:00:00.000Z',
      }),
      expect.objectContaining({
        kind: 'idea',
        title: 'Signal Atlas',
        source: expect.objectContaining({ reference: 'ideas.md' }),
      }),
      expect.objectContaining({
        kind: 'preference',
        title: 'Avoid generic directories',
      }),
    ]))
  })

  it('turns a reviewed CV into evidence-backed capabilities and achievements', () => {
    const memories = careerProfileToApprovedMemory({
      headline: 'Product engineer',
      summary: 'Builds AI products.',
      skills: [{
        name: 'TypeScript',
        evidence: ['Shipped a strict React product'],
        confidence: 95,
      }],
      experiences: [],
      achievements: ['Launched three products'],
      education: [],
    }, {
      kind: 'cv',
      label: 'Reviewed CV · david.pdf',
    }, {
      now: '2026-08-27T12:00:00.000Z',
      id: (index) => `cv-${index}`,
    })

    expect(memories).toEqual([
      expect.objectContaining({
        id: 'cv-0',
        kind: 'capability',
        title: 'TypeScript',
        evidence: ['Shipped a strict React product'],
        reviewStatus: 'approved',
      }),
      expect.objectContaining({
        id: 'cv-1',
        kind: 'achievement',
        title: 'Launched three products',
      }),
    ])
  })

  it('replaces the same sourced memory on re-import instead of duplicating it', () => {
    const original = createProfileMemoryItem({
      kind: 'capability',
      title: 'TypeScript',
      detail: 'Old detail',
      tags: ['typescript'],
      source: { kind: 'cv', label: 'Reviewed CV · david.pdf' },
      evidence: [],
    }, { id: 'old', now: '2026-08-26T10:00:00.000Z' })
    const refreshed = { ...original, id: 'new', detail: 'Fresh detail' }

    expect(mergeProfileMemoryItems([original], [refreshed])).toEqual([
      expect.objectContaining({ id: 'new', detail: 'Fresh detail' }),
    ])
  })
})
