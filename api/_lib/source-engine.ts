import { randomUUID } from 'node:crypto'
import type { Opportunity, RawSignal, ScanRun, SourceSubscription } from '../../shared/domain.js'
import { activeSubscriptions } from '../../shared/source-packs.js'
import { candidateFromSignal, promoteSignal } from '../../shared/opportunity-signals.js'
import { cachedResult, contentHash } from './cache.js'
import { mapWithConcurrency } from './concurrency.js'
import { analyzeOpportunitySource, opportunityAnalysisCacheInput } from './openai.js'
import { collectRegisteredSource } from './source-registry.js'
import type { CollectionResult } from './collectors/types.js'
import {
  acquireScanLock,
  getSourceEngineState,
  mergeCandidates,
  mergeSignals,
  releaseScanLock,
  reserveCronAnalysis,
  saveSourceEngineState,
} from './source-store.js'

export type SourceScanOptions = {
  dryRun?: boolean
  analysisLimit?: number
  now?: string
}

export function materiallyChangedSignals(existing: RawSignal[], incoming: RawSignal[]) {
  const previousById = new Map(existing.map((signal) => [signal.id, signal]))
  return incoming.filter((signal) => previousById.get(signal.id)?.contentHash !== signal.contentHash)
}

export async function runSourceScan(options: SourceScanOptions = {}) {
  const now = options.now ?? new Date().toISOString()
  const runId = randomUUID()
  const dryRun = options.dryRun ?? false
  const analysisLimit = Math.min(5, Math.max(0, options.analysisLimit ?? 5))
  const locked = await acquireScanLock(runId)
  if (!locked && !dryRun) throw new Error('Another source scan is already running.')

  const run: ScanRun = {
    id: runId,
    startedAt: now,
    status: dryRun ? 'dry-run' : 'running',
    sourcesChecked: 0,
    sourcesChanged: 0,
    signalsFound: 0,
    signalsPromoted: 0,
    signalsSuppressed: 0,
    analysesUsed: 0,
    errors: [],
  }

  try {
    const state = await getSourceEngineState()
    const enabledPackIds = [
      'agent-infrastructure', 'sports-vision', 'creative-publishing', 'hardware-robotics', 'science-wildcard',
    ]
    const subscriptions = activeSubscriptions(enabledPackIds)
      .filter((source) => !state.pausedPackIds.includes(source.sourcePackId))
      .map((source) => {
        const previous = state.subscriptions[source.id]
        return {
          ...source,
          cursor: previous?.cursor,
          etag: previous?.etag,
          lastModified: previous?.lastModified,
          contentHash: previous?.contentHash,
          lastCheckedAt: previous?.lastCheckedAt,
          lastChangedAt: previous?.lastChangedAt,
        }
      })

    const results = await mapWithConcurrency(subscriptions, 8, async (subscription): Promise<
      { result: CollectionResult } | { subscription: SourceSubscription; error: string }
    > => {
      try {
        return { result: await collectRegisteredSource(subscription, now) }
      } catch (error) {
        return { subscription, error: error instanceof Error ? error.message : 'Unknown source failure.' }
      }
    })

    run.sourcesChecked = results.length
    const incoming: RawSignal[] = []
    for (const item of results) {
      if (!('result' in item)) {
        run.errors.push(`${item.subscription.label}: ${item.error}`)
        continue
      }
      state.subscriptions[item.result.subscription.id] = item.result.subscription
      if (item.result.changed) run.sourcesChanged += 1
      const subscription = item.result.subscription
      incoming.push(...item.result.signals.map((signal) => promoteSignal(signal, subscription)))
    }

    const materiallyChanged = materiallyChangedSignals(state.signals, incoming)
    run.signalsFound = materiallyChanged.length
    run.signalsPromoted = materiallyChanged.filter((signal) => signal.promotionStatus === 'promoted').length
    run.signalsSuppressed = materiallyChanged.filter((signal) => signal.promotionStatus === 'suppressed').length

    const subscriptionById = new Map(subscriptions.map((source) => [source.id, source]))
    const promoted = materiallyChanged
      .filter((signal) => signal.promotionStatus === 'promoted')
      .sort((left, right) => right.preliminaryScore - left.preliminaryScore)
    const candidates = promoted.flatMap((signal) => {
      const subscription = subscriptionById.get(signal.subscriptionId)
      return subscription ? [candidateFromSignal(signal, subscription)] : []
    })

    if (!dryRun) {
      state.signals = mergeSignals(state.signals, incoming)
      state.candidates = mergeCandidates(state.candidates, candidates)
      const existingOpportunityCandidates = new Set(state.opportunities.map((opportunity) => opportunity.candidateId).filter(Boolean))
      const analysisCandidates = candidates
        .filter((item) => !existingOpportunityCandidates.has(item.id))
        .filter((candidate): candidate is typeof candidate & { sourceText: string } =>
          Boolean(candidate.sourceText && candidate.sourceText.length >= 80))
        .slice(0, analysisLimit)
      const analyses = await mapWithConcurrency(analysisCandidates, 5, async (candidate) => {
        try {
          const input = {
            sourceUrl: candidate.canonicalUrl ?? '',
            sourceText: candidate.sourceText.slice(0, 30_000),
          }
          let reserved = false
          const result = await cachedResult('opportunity-v2', opportunityAnalysisCacheInput(input), async () => {
            reserved = await reserveCronAnalysis()
            if (!reserved) throw new Error('Monthly automatic analysis budget exhausted.')
            return analyzeOpportunitySource(input)
          })
          const method: Opportunity['provenance']['method'] = candidate.connector === 'page-monitor'
            ? 'page-monitor'
            : candidate.connector === 'feed-monitor' ? 'feed' : `${candidate.connector}-api` as Opportunity['provenance']['method']
          const opportunity: Opportunity = {
            ...result.data,
            id: `opportunity-${contentHash(candidate.id).slice(0, 20)}`,
            candidateId: candidate.id,
            discoveredAt: candidate.discoveredAt,
            verifiedAt: now,
            provenance: {
              mode: 'live',
              evidenceRole: 'primary',
              connector: candidate.connector,
              method,
              wordCount: candidate.sourceText.trim().split(/\s+/).length,
              warnings: [],
            },
          }
          return { opportunity, used: !result.cached && reserved, error: '' }
        } catch (error) {
          return {
            opportunity: null,
            used: false,
            error: `${candidate.title}: ${error instanceof Error ? error.message : 'Automatic analysis failed.'}`,
          }
        }
      })
      for (const analysis of analyses) {
        if (analysis.used) run.analysesUsed += 1
        if (analysis.error) run.errors.push(analysis.error)
        if (analysis.opportunity) {
          state.opportunities = [analysis.opportunity, ...state.opportunities.filter((item) => item.id !== analysis.opportunity?.id)].slice(0, 100)
        }
      }
      run.completedAt = new Date().toISOString()
      run.status = run.errors.length ? 'partial' : 'completed'
      state.runs = [run, ...state.runs].slice(0, 20)
      await saveSourceEngineState(state)
    } else {
      run.completedAt = new Date().toISOString()
    }
    return { run, candidates, signals: materiallyChanged }
  } finally {
    if (locked) await releaseScanLock(runId)
  }
}
