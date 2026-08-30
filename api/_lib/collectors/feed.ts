import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import type { RawSignal, SourceSubscription } from '../../../shared/domain.js'
import { contentHash } from '../cache.js'
import { fetchPublicTextDocument } from '../safe-fetch.js'
import type { CollectionResult } from './types.js'

const text = ($: cheerio.CheerioAPI, element: AnyNode, selectors: string[]) => {
  for (const selector of selectors) {
    const value = $(element).find(selector).first().text().replace(/\s+/g, ' ').trim()
    if (value) return value
  }
  return ''
}

export function parseFeedEntries(raw: string, subscription: SourceSubscription, observedAt: string): RawSignal[] {
  const $ = cheerio.load(raw, { xmlMode: true })
  const items = $('item, entry').toArray().slice(0, 60)
  return items.flatMap((element, index) => {
    const title = text($, element, ['title'])
    const summary = text($, element, ['description', 'summary', 'content'])
    const guid = text($, element, ['guid', 'id'])
    const linkElement = $(element).find('link').first()
    const link = linkElement.attr('href') || linkElement.text().trim()
    const published = text($, element, ['pubDate', 'published', 'updated'])
    if (!title && !summary) return []
    const externalId = guid || link || `${subscription.id}:${index}:${title}`
    const hash = contentHash({ title, summary, link, published })
    return [{
      id: `signal-${contentHash(`${subscription.id}:${externalId}`).slice(0, 20)}`,
      subscriptionId: subscription.id,
      sourcePackId: subscription.sourcePackId,
      adapterId: subscription.adapterId,
      scope: subscription.scope,
      privacy: subscription.privacy,
      externalId,
      canonicalUrl: /^https?:\/\//.test(link) ? link : subscription.endpoint,
      title: title || subscription.label,
      summary: summary.slice(0, 2_000),
      sourceText: [title, summary].filter(Boolean).join('\n\n').slice(0, 30_000),
      publishedAt: published && !Number.isNaN(new Date(published).getTime()) ? new Date(published).toISOString() : null,
      observedAt,
      contentHash: hash,
      changeKind: 'new' as const,
      promotionStatus: 'pending' as const,
      promotionReasons: [],
      suppressionReasons: [],
      preliminaryScore: 0,
    } satisfies RawSignal]
  })
}

export async function collectFeed(subscription: SourceSubscription, now = new Date().toISOString()): Promise<CollectionResult> {
  if (!subscription.endpoint) throw new Error(`Feed ${subscription.id} has no endpoint.`)
  const document = await fetchPublicTextDocument(subscription.endpoint, subscription)
  const updated = {
    ...subscription,
    etag: document.etag,
    lastModified: document.lastModified,
    lastCheckedAt: now,
  }
  if (document.notModified) return { subscription: updated, signals: [], changed: false }
  const hash = contentHash(document.body)
  if (hash === subscription.contentHash) {
    return { subscription: { ...updated, contentHash: hash }, signals: [], changed: false }
  }
  return {
    subscription: { ...updated, contentHash: hash, lastChangedAt: now },
    signals: parseFeedEntries(document.body, subscription, now),
    changed: true,
  }
}
