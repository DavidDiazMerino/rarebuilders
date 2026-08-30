import { describe, expect, it } from 'vitest'
import type { SourceSubscription } from '../../../shared/domain'
import { parseFeedEntries } from './feed'

const source: SourceSubscription = {
  id: 'test-feed', adapterId: 'feed-monitor', sourcePackId: 'agent-infrastructure', label: 'Test feed',
  kind: 'feed', scope: { type: 'global' }, privacy: 'public', cadence: 'twice-weekly',
  endpoint: 'https://example.com/feed.xml', positiveTerms: [], negativeTerms: [], languages: ['English'], trust: 80, enabled: true,
}

describe('feed collector', () => {
  it('normalizes RSS and keeps stable identifiers', () => {
    const xml = `<rss><channel><item><guid>call-1</guid><title>Applications open</title><link>https://example.com/call</link><description>Prize challenge with a deadline.</description><pubDate>Sun, 30 Aug 2026 10:00:00 GMT</pubDate></item></channel></rss>`
    const first = parseFeedEntries(xml, source, '2026-08-30T20:00:00.000Z')
    const second = parseFeedEntries(xml, source, '2026-08-31T20:00:00.000Z')
    expect(first).toHaveLength(1)
    expect(first[0].id).toBe(second[0].id)
    expect(first[0].canonicalUrl).toBe('https://example.com/call')
  })

  it('normalizes Atom links and summaries', () => {
    const xml = `<feed><entry><id>atom-1</id><title>Builder grant</title><link href="https://example.com/grant"/><summary>Submissions open.</summary><updated>2026-08-30T10:00:00Z</updated></entry></feed>`
    const [entry] = parseFeedEntries(xml, source, '2026-08-30T20:00:00.000Z')
    expect(entry.title).toBe('Builder grant')
    expect(entry.canonicalUrl).toBe('https://example.com/grant')
  })
})
