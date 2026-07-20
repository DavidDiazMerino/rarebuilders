import { describe, expect, it } from 'vitest'
import { formatDeadlineMoment } from './format'

describe('deadline formatting', () => {
  it('turns an ISO timestamp into a concise local editorial date', () => {
    expect(formatDeadlineMoment('2026-07-21T20:00:00-04:00', 'Europe/Madrid'))
      .toBe('Jul 22 · 02:00')
  })

  it('keeps unknown and malformed deadlines honest', () => {
    expect(formatDeadlineMoment(null)).toBe('Unknown')
    expect(formatDeadlineMoment('not-a-date')).toBe('not-a-date')
  })
})
