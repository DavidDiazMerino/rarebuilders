import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ProfileMemoryItem } from '../../shared/domain'
import { ProfileMemoryLedger } from './ProfileMemoryLedger'

const items: ProfileMemoryItem[] = [
  {
    id: 'pending-idea',
    kind: 'idea',
    title: 'Research product from opportunity dossiers',
    detail: 'Turn the dossier workflow into a reusable research product.',
    tags: ['research'],
    source: { kind: 'repository', label: 'docs/PRODUCT.md', reference: 'docs/PRODUCT.md:163' },
    evidence: ['The dossier already separates facts, inferences and unknowns.'],
    reviewStatus: 'pending',
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: '2026-08-27T10:00:00.000Z',
  },
  {
    id: 'approved-capability',
    kind: 'capability',
    title: 'Rapid TypeScript prototyping',
    detail: 'Can ship strict TypeScript product slices quickly.',
    tags: ['typescript'],
    source: { kind: 'github', label: 'Public GitHub' },
    evidence: ['Tested React application.'],
    reviewStatus: 'approved',
    createdAt: '2026-08-26T10:00:00.000Z',
    updatedAt: '2026-08-26T11:00:00.000Z',
    reviewedAt: '2026-08-26T11:00:00.000Z',
  },
]

describe('ProfileMemoryLedger', () => {
  it('separates pending review from approved memory and exposes provenance', () => {
    render(<ProfileMemoryLedger items={items} onReview={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Pending review' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Approved memory' })).toBeInTheDocument()
    expect(screen.getByText('docs/PRODUCT.md')).toBeInTheDocument()
    expect(screen.getByText('Public GitHub')).toBeInTheDocument()
  })

  it('lets David explicitly approve a pending item', async () => {
    const onReview = vi.fn()
    render(<ProfileMemoryLedger items={items} onReview={onReview} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve Research product from opportunity dossiers' }))

    expect(onReview).toHaveBeenCalledWith('pending-idea', 'approved')
  })

  it('keeps rejected memory visible as a separate audit trail', () => {
    render(<ProfileMemoryLedger items={[{
      ...items[0],
      reviewStatus: 'rejected',
      reviewNote: 'Too generic',
      reviewedAt: '2026-08-27T11:00:00.000Z',
    }]} onReview={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Rejected memory' })).toBeInTheDocument()
    expect(screen.getByText('Too generic')).toBeInTheDocument()
  })
})
