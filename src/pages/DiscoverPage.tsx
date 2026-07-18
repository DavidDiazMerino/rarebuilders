import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  automatedConnectorIds,
  type AutomatedConnectorId,
  type OpportunityCandidate,
} from '../../shared/domain'
import { PageHeader } from '../components/PageHeader'
import { api, ApiRequestError, type ConnectorSearchResult } from '../lib/api'
import { candidatePreFitDetails, profileDiscoveryFocus } from '../lib/candidates'
import { useAppState } from '../state/AppState'

const connectorLabels: Array<{ id: AutomatedConnectorId; label: string }> = [
  { id: 'github', label: 'GitHub bounties' },
  { id: 'devpost', label: 'Devpost' },
  { id: 'eu', label: 'EU calls' },
  { id: 'kaggle', label: 'Kaggle' },
]

const presets = [
  'AI agents',
  'developer tools',
  'creative technology',
  'publishing',
]

export function DiscoverPage() {
  const navigate = useNavigate()
  const { data, upsertCandidates, updateCandidateStatus, updateConnectorState } = useAppState()
  const [query, setQuery] = useState('')
  const [selectedConnectors, setSelectedConnectors] = useState<AutomatedConnectorId[]>(
    [...automatedConnectorIds],
  )
  const [connectorResults, setConnectorResults] = useState<ConnectorSearchResult[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | OpportunityCandidate['status']>('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const profileFocus = useMemo(() => profileDiscoveryFocus(data.profile), [data.profile])

  const visibleCandidates = useMemo(() => data.candidates
    .filter((candidate) => candidate.connector !== 'manual')
    .filter((candidate) => candidate.connector !== 'manual' && selectedConnectors.includes(candidate.connector))
    .filter((candidate) => statusFilter === 'all' || candidate.status === statusFilter)
    .map((candidate) => ({ candidate, preFit: candidatePreFitDetails(data.profile, candidate) }))
    .sort((left, right) => right.preFit.score - left.preFit.score)
    .slice(0, 25), [
    data.candidates,
    data.profile,
    selectedConnectors,
    statusFilter,
  ])

  const search = async (nextQuery = query) => {
    if (!selectedConnectors.length) return
    setLoading(true)
    setError('')
    setQuery(nextQuery)
    const attemptedAt = new Date().toISOString()
    selectedConnectors.forEach((connector) => updateConnectorState(connector, {
      ...data.connectorState[connector],
      status: 'refreshing',
      lastAttemptAt: attemptedAt,
    }))
    try {
      const response = await api.discover(selectedConnectors, nextQuery)
      setConnectorResults(response.data)
      const candidates = response.data.flatMap((result) => result.candidates)
      upsertCandidates(candidates)
      const refreshedAt = new Date().toISOString()
      response.data.forEach((result) => updateConnectorState(result.connector, {
        status: !result.configured
          ? 'setup-needed'
          : result.error
            ? /429|rate|quota/i.test(result.error) ? 'limited' : 'error'
            : 'ready',
        lastAttemptAt: attemptedAt,
        lastSuccessAt: result.error ? data.connectorState[result.connector]?.lastSuccessAt : refreshedAt,
        error: result.error,
      }))
      if (!candidates.length && response.data.every((result) => result.error)) {
        setError('Every selected connector failed. Existing source history is still available.')
      }
    } catch (caught) {
      const retryAt = caught instanceof ApiRequestError && caught.retryAfter
        ? new Date(Date.now() + caught.retryAfter * 1_000).toISOString()
        : undefined
      selectedConnectors.forEach((connector) => updateConnectorState(connector, {
        ...data.connectorState[connector],
        status: caught instanceof ApiRequestError && caught.status === 429 ? 'limited' : 'error',
        lastAttemptAt: attemptedAt,
        retryAt,
        error: caught instanceof Error ? caught.message : 'Discovery failed.',
      }))
      setError(caught instanceof Error ? caught.message : 'Discovery failed.')
    } finally {
      setLoading(false)
    }
  }

  const inspect = (candidate: OpportunityCandidate) => {
    updateCandidateStatus(candidate.id, 'inspected')
    window.sessionStorage.setItem('rarebuilders:discovery-candidate', JSON.stringify(candidate))
    navigate('/inbox?from=discover')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live opportunity connectors"
        title="Search where different kinds of opportunity live."
        description="GitHub, Devpost, EU calls and Kaggle return raw candidates. Pre-fit is a cheap profile match; GPT-5.6 only runs for candidates you inspect or your daily budget selects."
        actions={(
          <button className="button secondary" onClick={() => void search()} disabled={loading || !selectedConnectors.length}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh sources
          </button>
        )}
      />

      <section className="discover-search">
        <div className="connector-selector">
          {connectorLabels.map((connector) => {
            const selected = selectedConnectors.includes(connector.id)
            const result = connectorResults.find((item) => item.connector === connector.id)
            const state = data.connectorState[connector.id]
            return (
              <button
                key={connector.id}
                className={selected ? 'selected' : ''}
                onClick={() => setSelectedConnectors((current) => selected
                  ? current.filter((item) => item !== connector.id)
                  : [...current, connector.id])}
              >
                {selected ? <Check size={14} /> : null}
                <span>{connector.label}</span>
                {state?.status && state.status !== 'idle' ? <em>{state.status.replace('-', ' ')}</em> : null}
                {!state && result?.error ? <em>{result.configured ? 'error' : 'setup needed'}</em> : null}
              </button>
            )
          })}
        </div>
        <div className="search-box">
          <Search size={20} />
          <input
            value={query}
            placeholder="Optional focus: AI agents, publishing, climate…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void search()
            }}
          />
          <button onClick={() => void search()} disabled={loading || !selectedConnectors.length}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}
            Search all
          </button>
        </div>
        <div className="preset-row">
          {profileFocus ? (
            <button className="profile-preset" onClick={() => void search(profileFocus)}>
              <Sparkles size={12} /> For {data.profile.name}: {profileFocus}
            </button>
          ) : null}
          {presets.map((preset) => (
            <button key={preset} onClick={() => void search(preset)}>{preset}</button>
          ))}
        </div>
        {connectorResults.some((result) => result.error) ? (
          <div className="connector-health">
            {connectorResults.filter((result) => result.error).map((result) => (
              <span key={result.connector}><AlertTriangle size={13} /> {result.connector}: {result.error}</span>
            ))}
          </div>
        ) : null}
        {connectorResults.some((result) => result.connector === 'kaggle' && !result.configured) ? (
          <div className="connector-setup-card">
            <KeyRound size={17} />
            <p>
              <strong>Kaggle needs a private API token</strong>
              <span>Generate it in Kaggle Settings, save it in Vercel as <code>KAGGLE_API_TOKEN</code>, then redeploy. Never paste it into a source or profile note.</span>
            </p>
            <a href="https://www.kaggle.com/settings/api" target="_blank" rel="noreferrer">
              Open Kaggle settings <ExternalLink size={13} />
            </a>
          </div>
        ) : null}
        <div className="discover-filters">
          <span>Showing up to 25 ranked candidates · decisions remain in local history</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">All states</option>
            <option value="new">New</option>
            <option value="inspected">Inspected</option>
            <option value="added">Added</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </section>

      {error ? <div className="inline-error"><AlertTriangle size={17} /> {error}</div> : null}

      {!visibleCandidates.length && !loading ? (
        <section className="discover-empty">
          <Search size={30} />
          <h2>Refresh the opportunity landscape.</h2>
          <p>The connectors will preserve candidates and their state in this browser.</p>
        </section>
      ) : (
        <section className="candidate-list">
          {visibleCandidates.map(({ candidate, preFit }) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-meta">
                <span className={`candidate-state ${candidate.status}`}>{candidate.status}</span>
                <span>{candidate.connector}</span>
                <span>{candidate.organizer}</span>
                <span>{candidate.deadline
                  ? `Deadline ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(candidate.deadline))}`
                  : 'Deadline unknown'}</span>
              </div>
              <div className="candidate-title-row">
                <h2>{candidate.title}</h2>
                <span className="prefit-score"><strong>{preFit.score}</strong><small>pre-fit</small></span>
              </div>
              <p>{candidate.summary.slice(0, 400) || 'No description was provided.'}</p>
              {preFit.matches.length || preFit.noGoMatches.length ? (
                <p className={preFit.noGoMatches.length ? 'profile-match-note warning' : 'profile-match-note'}>
                  {preFit.noGoMatches.length
                    ? `Profile conflict: ${preFit.noGoMatches.join(', ')}`
                    : `Matches your profile: ${preFit.matches.join(', ')}`}
                </p>
              ) : (
                <p className="profile-match-note muted">No strong profile evidence yet.</p>
              )}
              <div className="candidate-footer">
                <div className="tag-row">
                  {candidate.tags.slice(0, 5).map((tag) => <em key={tag}><Tag size={12} /> {tag}</em>)}
                </div>
                <div>
                  {candidate.canonicalUrl ? (
                    <a href={candidate.canonicalUrl} target="_blank" rel="noreferrer" className="icon-button" title="Open original source">
                      <ExternalLink size={16} />
                    </a>
                  ) : null}
                  <button className="button primary" onClick={() => inspect(candidate)}>
                    {candidate.status === 'added' ? 'Reinspect' : 'Inspect candidate'} <ArrowRight size={16} />
                  </button>
                  {candidate.status !== 'added' ? (
                    <button className="button secondary" onClick={() => updateCandidateStatus(candidate.id, 'dismissed')}>
                      Dismiss
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
