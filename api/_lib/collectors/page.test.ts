import { describe, expect, it } from 'vitest'
import type { SourceSubscription } from '../../../shared/domain'
import { pageSignal } from './page'

const source: SourceSubscription = {
  id: 'test-page', adapterId: 'page-monitor', sourcePackId: 'hardware-robotics', label: 'Test page',
  kind: 'page', scope: { type: 'global' }, privacy: 'public', cadence: 'twice-weekly',
  endpoint: 'https://example.com/contests', positiveTerms: [], negativeTerms: [], languages: ['English'], trust: 80, enabled: true,
}

describe('page collector', () => {
  it('ignores volatile view counters when hashing a page', () => {
    const first = pageSignal(source, '<html><title>Contest</title><main><h1>Hardware challenge</h1><p>Applications open with a prize and deadline.</p><p>1,200 views</p></main></html>', source.endpoint!, '2026-08-30T10:00:00Z')
    const second = pageSignal(source, '<html><title>Contest</title><main><h1>Hardware challenge</h1><p>Applications open with a prize and deadline.</p><p>1,350 views</p></main></html>', source.endpoint!, '2026-08-31T10:00:00Z')
    expect(first.hash).toBe(second.hash)
  })

  it('detects a material deadline change', () => {
    const first = pageSignal(source, '<html><main><h1>Contest</h1><p>Applications open. Deadline September 1. Prize available.</p></main></html>', source.endpoint!, '2026-08-30T10:00:00Z')
    const second = pageSignal(source, '<html><main><h1>Contest</h1><p>Applications open. Deadline October 1. Prize available.</p></main></html>', source.endpoint!, '2026-08-31T10:00:00Z')
    expect(first.hash).not.toBe(second.hash)
  })
})
