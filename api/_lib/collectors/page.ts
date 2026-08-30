import type { RawSignal, SourceSubscription } from '../../../shared/domain.js'
import { contentHash } from '../cache.js'
import { extractHtmlSource, fetchPublicTextDocument } from '../safe-fetch.js'
import type { CollectionResult } from './types.js'

function stablePageText(value: string) {
  return value
    .replace(/\b\d+\s+(seconds?|minutes?|hours?)\s+ago\b/gi, '')
    .replace(/\bupdated\s+\d{1,2}:\d{2}\b/gi, '')
    .replace(/\b\d{1,3}(?:,\d{3})*\s+views?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function pageSignal(
  subscription: SourceSubscription,
  raw: string,
  url: string,
  observedAt: string,
): { signal: RawSignal; hash: string } {
  const extraction = extractHtmlSource(raw, url)
  const stable = stablePageText(extraction.text)
  const hash = contentHash(stable)
  return {
    hash,
    signal: {
      id: `signal-${contentHash(`${subscription.id}:${hash}`).slice(0, 20)}`,
      subscriptionId: subscription.id,
      sourcePackId: subscription.sourcePackId,
      adapterId: subscription.adapterId,
      scope: subscription.scope,
      privacy: subscription.privacy,
      externalId: hash,
      canonicalUrl: extraction.url,
      title: extraction.title || subscription.label,
      summary: stable.slice(0, 2_000),
      sourceText: extraction.text,
      publishedAt: null,
      observedAt,
      contentHash: hash,
      changeKind: subscription.contentHash ? 'updated' : 'new',
      promotionStatus: 'pending',
      promotionReasons: [],
      suppressionReasons: [],
      preliminaryScore: 0,
    },
  }
}

export async function collectPage(subscription: SourceSubscription, now = new Date().toISOString()): Promise<CollectionResult> {
  if (!subscription.endpoint) throw new Error(`Page monitor ${subscription.id} has no endpoint.`)
  const document = await fetchPublicTextDocument(subscription.endpoint, subscription)
  const updated = {
    ...subscription,
    etag: document.etag,
    lastModified: document.lastModified,
    lastCheckedAt: now,
  }
  if (document.notModified) return { subscription: updated, signals: [], changed: false }
  const { signal, hash } = pageSignal(subscription, document.body, document.url, now)
  if (hash === subscription.contentHash) {
    return { subscription: { ...updated, contentHash: hash }, signals: [], changed: false }
  }
  return {
    subscription: { ...updated, contentHash: hash, lastChangedAt: now },
    signals: [signal],
    changed: true,
  }
}
