import { useEffect, useRef, useState } from 'react'
import {
  automatedConnectorIds,
  type AutomatedConnectorId,
  type Opportunity,
} from '../../shared/domain'
import { api } from './api'
import { candidatePreFit, profileDiscoveryFocus } from './candidates'
import { useAppState } from '../state/AppState'

const connectors = [...automatedConnectorIds]

export function useDailyDiscovery() {
  const {
    data,
    upsertCandidates,
    updateCandidateStatus,
    updateConnectorState,
    addOpportunity,
  } = useAppState()
  const [refreshing, setRefreshing] = useState(false)
  const running = useRef(false)
  const attemptedDay = useRef('')

  useEffect(() => {
    if (running.current || !data.profile.onboardingComplete) return
    const day = new Date().toISOString().slice(0, 10)
    if (attemptedDay.current === day) return
    if (connectors.every((connector) => data.connectorState[connector]?.lastSuccessAt?.startsWith(day))) return

    attemptedDay.current = day
    running.current = true
    setRefreshing(true)
    const refresh = async () => {
      const attemptedAt = new Date().toISOString()
      connectors.forEach((connector) => updateConnectorState(connector, {
        ...data.connectorState[connector],
        status: 'refreshing',
        lastAttemptAt: attemptedAt,
      }))
      try {
        const focus = profileDiscoveryFocus(data.profile)
        const [discoveryRuns, capabilities] = await Promise.all([
          Promise.all([
            api.discover(connectors, ''),
            ...(focus ? [api.discover(connectors, focus)] : []),
          ]),
          api.capabilities().catch(() => null),
        ])
        const byConnector = new Map<AutomatedConnectorId, (typeof discoveryRuns)[number]['data'][number]>()
        for (const discovery of discoveryRuns) {
          for (const result of discovery.data) {
            const previous = byConnector.get(result.connector)
            const candidates = new Map((previous?.candidates ?? []).map((candidate) => [candidate.id, candidate]))
            result.candidates.forEach((candidate) => candidates.set(candidate.id, candidate))
            byConnector.set(result.connector, {
              ...result,
              candidates: [...candidates.values()],
              error: previous?.error && result.error ? `${previous.error} ${result.error}` : previous?.error ?? result.error,
              configured: previous?.configured ?? result.configured,
            })
          }
        }
        const discovery = { data: [...byConnector.values()] }
        const candidates = discovery.data.flatMap((result) => result.candidates)
        upsertCandidates(candidates)
        const refreshedAt = new Date().toISOString()
        discovery.data.forEach((result) => updateConnectorState(result.connector, {
          status: !result.configured
            ? 'setup-needed'
            : result.error
              ? /429|rate|quota/i.test(result.error) ? 'limited' : 'error'
              : 'ready',
          lastAttemptAt: attemptedAt,
          lastSuccessAt: result.error ? data.connectorState[result.connector]?.lastSuccessAt : refreshedAt,
          error: result.error,
        }))

        const budget = capabilities?.data.owner ? data.settings.autoAnalysisBudget : 0
        if (!budget) return
        const selected = candidates
          .filter((candidate) => candidate.status === 'new')
          .sort((left, right) => candidatePreFit(data.profile, right) - candidatePreFit(data.profile, left))
          .slice(0, budget)

        for (const candidate of selected) {
          try {
            let sourceText = candidate.sourceText ?? ''
            let sourceUrl = candidate.canonicalUrl ?? ''
            let method: Opportunity['provenance']['method'] = `${candidate.connector}-api` as Opportunity['provenance']['method']
            let warnings: string[] = []
            let wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0
            if (sourceText.length < 80 && sourceUrl) {
              const fetched = await api.fetchSource(sourceUrl)
              sourceText = fetched.data.text
              sourceUrl = fetched.data.url
              method = fetched.data.method
              warnings = fetched.data.warnings
              wordCount = fetched.data.wordCount
            }
            if (sourceText.length < 80) continue
            updateCandidateStatus(candidate.id, 'inspected')
            const result = await api.analyzeOpportunity({
              sourceUrl,
              sourceText: sourceText.slice(0, 30_000),
            })
            const timestamp = new Date().toISOString()
            const opportunity: Opportunity = {
              ...result.data,
              id: crypto.randomUUID(),
              candidateId: candidate.id,
              discoveredAt: timestamp,
              verifiedAt: timestamp,
              provenance: {
                mode: 'live',
                evidenceRole: sourceUrl ? 'primary' : 'pasted',
                connector: candidate.connector,
                method,
                wordCount,
                warnings,
              },
            }
            addOpportunity(opportunity)
          } catch {
            // One noisy source must not abort the rest of the daily shortlist.
          }
        }
      } catch (error) {
        connectors.forEach((connector) => updateConnectorState(connector, {
          ...data.connectorState[connector],
          status: 'error',
          lastAttemptAt: attemptedAt,
          error: error instanceof Error ? error.message : 'Daily discovery failed.',
        }))
        // Existing radar data remains usable when daily discovery is offline.
      } finally {
        running.current = false
        setRefreshing(false)
      }
    }
    void refresh()
  }, [
    addOpportunity,
    data.connectorState,
    data.profile,
    data.settings.autoAnalysisBudget,
    updateConnectorState,
    updateCandidateStatus,
    upsertCandidates,
  ])

  return refreshing
}
