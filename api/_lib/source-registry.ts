import type { RawSignal, SourceCapability, SourceSubscription } from '../../shared/domain.js'
import { contentHash } from './cache.js'
import { collectFeed } from './collectors/feed.js'
import { collectPage } from './collectors/page.js'
import type { CollectionResult } from './collectors/types.js'
import { searchConnector, type ConnectorSearchResult } from './connectors.js'

type SourceAdapter = {
  capability: () => SourceCapability
  search?: (query: string) => Promise<ConnectorSearchResult>
  collect?: (subscription: SourceSubscription) => Promise<CollectionResult>
}

const registry = new Map<string, SourceAdapter>()

export function registerSourceAdapter(id: string, adapter: SourceAdapter) {
  registry.set(id, adapter)
}

const catalogue = (id: 'github' | 'devpost' | 'eu' | 'kaggle', label: string, configured = true) => {
  registerSourceAdapter(id, {
    capability: () => ({
      id, label, group: 'catalogue', collectorKinds: ['search'], configured,
      costClass: configured ? 'free' : 'credentialed', privacy: 'public', experimental: false,
    }),
    search: (query) => searchConnector(id, query),
  })
}

catalogue('github', 'GitHub bounties')
catalogue('devpost', 'Devpost')
catalogue('eu', 'EU Funding & Tenders')
catalogue('kaggle', 'Kaggle', Boolean(process.env.KAGGLE_API_TOKEN || (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY)))

registerSourceAdapter('feed-monitor', {
  capability: () => ({ id: 'feed-monitor', label: 'RSS / Atom monitor', group: 'monitor', collectorKinds: ['feed'], configured: true, costClass: 'free', privacy: 'public', experimental: false }),
  collect: collectFeed,
})
registerSourceAdapter('page-monitor', {
  capability: () => ({ id: 'page-monitor', label: 'Official page monitor', group: 'monitor', collectorKinds: ['page'], configured: true, costClass: 'free', privacy: 'public', experimental: false }),
  collect: collectPage,
})

export function sourceCapabilities() {
  return [...registry.values()].map((adapter) => adapter.capability())
}

export function hasSourceAdapter(id: string) {
  return registry.has(id)
}

export async function searchRegisteredSource(id: string, query: string) {
  const adapter = registry.get(id)
  if (!adapter?.search) {
    return { connector: id, candidates: [], configured: Boolean(adapter), error: 'This source does not support catalogue search.' }
  }
  return adapter.search(query)
}

function candidateSignal(subscription: SourceSubscription, candidate: ConnectorSearchResult['candidates'][number], observedAt: string): RawSignal {
  const hash = contentHash({
    title: candidate.title,
    summary: candidate.summary,
    deadline: candidate.deadline,
    reward: candidate.reward,
    sourceText: candidate.sourceText,
  })
  return {
    id: `signal-${contentHash(`${subscription.id}:${candidate.externalId}`).slice(0, 20)}`,
    subscriptionId: subscription.id,
    sourcePackId: subscription.sourcePackId,
    adapterId: subscription.adapterId,
    scope: subscription.scope,
    privacy: subscription.privacy,
    externalId: candidate.externalId,
    canonicalUrl: candidate.canonicalUrl,
    title: candidate.title,
    summary: candidate.summary,
    sourceText: candidate.sourceText,
    publishedAt: null,
    observedAt,
    contentHash: hash,
    changeKind: 'new',
    promotionStatus: 'pending',
    promotionReasons: [],
    suppressionReasons: [],
    preliminaryScore: 0,
  }
}

export async function collectRegisteredSource(subscription: SourceSubscription, now = new Date().toISOString()): Promise<CollectionResult> {
  const adapter = registry.get(subscription.adapterId)
  if (!adapter) throw new Error(`Unknown source adapter: ${subscription.adapterId}`)
  if (subscription.kind === 'search') {
    if (!adapter.search) throw new Error(`Adapter ${subscription.adapterId} cannot search.`)
    const result = await adapter.search(subscription.query ?? '')
    if (result.error && !result.candidates.length) throw new Error(result.error)
    return {
      subscription: { ...subscription, lastCheckedAt: now, lastChangedAt: result.candidates.length ? now : subscription.lastChangedAt },
      signals: result.candidates.map((candidate) => candidateSignal(subscription, candidate, now)),
      changed: result.candidates.length > 0,
    }
  }
  if (!adapter.collect) throw new Error(`Adapter ${subscription.adapterId} cannot collect.`)
  return adapter.collect(subscription)
}
