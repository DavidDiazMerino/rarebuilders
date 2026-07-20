import {
  AlertTriangle,
  ArrowRight,
  Check,
  ExternalLink,
  FileSearch,
  GitFork,
  Link2,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  TextCursorInput,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ConnectorId, Opportunity, OpportunityCandidate } from '../../shared/domain'
import { PageHeader } from '../components/PageHeader'
import { SourceTextPreview } from '../components/SourceTextPreview'
import { api, type GithubOpportunityCandidate, type SourceExtraction } from '../lib/api'
import { buildRadar } from '../lib/scoring'
import { candidateId } from '../lib/candidates'
import { formatDeadlineMoment } from '../lib/format'
import { useAppState } from '../state/AppState'

export function InboxPage() {
  const { data, addOpportunity, upsertCandidates } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [fetching, setFetching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [sourceInfo, setSourceInfo] = useState<Pick<SourceExtraction, 'method' | 'wordCount' | 'warnings'> | null>(null)
  const [preview, setPreview] = useState<Opportunity | null>(null)
  const [activeCandidateId, setActiveCandidateId] = useState('')
  const [activeConnector, setActiveConnector] = useState<ConnectorId>('manual')
  const [sourceView, setSourceView] = useState<'rendered' | 'raw'>('raw')
  const detectedFacts = useMemo(() => {
    const find = (labels: string[]) => {
      const match = sourceText.split('\n').find((line) =>
        labels.some((label) => line.trim().toLowerCase().startsWith(`${label}:`)))
      return match?.slice(match.indexOf(':') + 1).trim() || ''
    }
    return {
      deadline: find(['deadline', 'deadlines', 'submission period', 'end date']),
      reward: find(['reward', 'prize', 'offer or reward']),
      organizer: find(['organizer', 'repository']),
    }
  }, [sourceText])

  useEffect(() => {
    if (location.search.includes('from=discover')) {
      const raw = window.sessionStorage.getItem('rarebuilders:discovery-candidate')
      if (!raw) return
      try {
        const candidate = JSON.parse(raw) as OpportunityCandidate
        const text = candidate.sourceText || [
          `Title: ${candidate.title}`,
          `Organizer: ${candidate.organizer}`,
          `Source: ${candidate.connector}`,
          `Reward: ${candidate.reward || 'unknown'}`,
          `Deadline: ${candidate.deadline || 'unknown'}`,
          `Participation: ${candidate.participationModes.join(', ')}`,
          '',
          candidate.summary,
        ].join('\n')
        setSourceUrl(candidate.canonicalUrl ?? '')
        setSourceTitle(candidate.title)
        setSourceText(text)
        setFetched(text.length >= 80)
        setSourceView('rendered')
        setActiveCandidateId(candidate.id)
        setActiveConnector(candidate.connector)
        window.sessionStorage.removeItem('rarebuilders:discovery-candidate')
      } catch {
        window.sessionStorage.removeItem('rarebuilders:discovery-candidate')
      }
      return
    }
    if (!location.search.includes('from=github')) return
    const raw = window.sessionStorage.getItem('rarebuilders:github-candidate')
    if (!raw) return
    try {
      const candidate = JSON.parse(raw) as GithubOpportunityCandidate
      const id = candidateId('github', String(candidate.id))
      const now = new Date().toISOString()
      setSourceUrl(candidate.url)
      setSourceTitle(candidate.title)
      setSourceText([
        `Title: ${candidate.title}`,
        `Repository: ${candidate.repository}`,
        `Labels: ${candidate.labels.join(', ') || 'none'}`,
        `Created: ${candidate.createdAt}`,
        `Updated: ${candidate.updatedAt}`,
        '',
        candidate.body,
      ].join('\n'))
      setFetched(true)
      setSourceView('rendered')
      setActiveCandidateId(id)
      setActiveConnector('github')
      upsertCandidates([{
        id,
        connector: 'github',
        externalId: String(candidate.id),
        canonicalUrl: candidate.url,
        title: candidate.title,
        organizer: candidate.repository,
        summary: candidate.body.slice(0, 500),
        deadline: null,
        reward: '',
        region: 'global',
        language: 'English',
        tags: candidate.labels,
        participationModes: ['individual', 'team'],
        sourceText: candidate.body.slice(0, 8_000),
        discoveredAt: now,
        lastSeenAt: now,
        status: 'inspected',
      }])
      window.sessionStorage.removeItem('rarebuilders:github-candidate')
    } catch {
      window.sessionStorage.removeItem('rarebuilders:github-candidate')
    }
  }, [location.search, upsertCandidates])

  const fetchUrl = async () => {
    if (!sourceUrl.trim()) return
    setFetching(true)
    setError('')
    try {
      const result = await api.fetchSource(sourceUrl.trim())
      setSourceUrl(result.data.url)
      setSourceTitle(result.data.title)
      setSourceText(result.data.text)
      setSourceInfo({
        method: result.data.method,
        wordCount: result.data.wordCount,
        warnings: result.data.warnings,
      })
      setFetched(true)
      setSourceView('rendered')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The source could not be fetched.')
    } finally {
      setFetching(false)
    }
  }

  const analyze = async () => {
    if (sourceText.trim().length < 80) {
      setError('Paste or fetch enough source text to analyze the opportunity.')
      return
    }
    setAnalyzing(true)
    setError('')
    try {
      const result = await api.analyzeOpportunity({
        sourceUrl: sourceUrl.trim(),
        sourceText: sourceText.slice(0, 30_000),
      })
      const id = activeCandidateId || candidateId('manual', sourceUrl.trim() || `${sourceTitle}:${sourceText.slice(0, 240)}`)
      const now = new Date().toISOString()
      const opportunity: Opportunity = {
        ...result.data,
        id: crypto.randomUUID(),
        candidateId: id,
        discoveredAt: now,
        verifiedAt: now,
        provenance: {
          mode: 'live',
          evidenceRole: sourceUrl.trim() ? 'primary' : 'pasted',
          connector: activeCandidateId ? activeConnector : 'manual',
          method: sourceInfo?.method ?? 'plain-text',
          wordCount: sourceInfo?.wordCount ?? sourceText.trim().split(/\s+/).length,
          warnings: sourceInfo?.warnings ?? [],
        },
      }
      upsertCandidates([{
        id,
        connector: activeCandidateId ? activeConnector : 'manual',
        externalId: sourceUrl.trim() || id,
        canonicalUrl: sourceUrl.trim() || undefined,
        title: opportunity.title,
        organizer: opportunity.organizer,
        summary: opportunity.summary,
        deadline: opportunity.deadline,
        reward: opportunity.reward,
        region: opportunity.region,
        language: opportunity.language,
        tags: opportunity.domains,
        participationModes: opportunity.participationModes,
        discoveredAt: now,
        lastSeenAt: now,
        status: 'inspected',
      }])
      setActiveCandidateId(id)
      setPreview(opportunity)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'GPT-5.6 analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const addPreview = () => {
    if (!preview) return
    const nextOpportunities = [preview, ...data.opportunities.filter((item) => item.id !== preview.id)]
    const radarIndex = buildRadar(data.profile, nextOpportunities, data.feedback)
      .findIndex((item) => item.opportunity.id === preview.id)
    addOpportunity(preview)
    navigate(`/opportunities/${preview.id}?added=1&rank=${radarIndex < 0 ? 'outside' : radarIndex + 1}`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Opportunity inbox"
        title="Turn a messy source into a decision."
        description="Fetch a public page or paste the announcement. You review the extracted text before GPT-5.6 normalizes anything."
        actions={<Link className="button secondary" to="/discover"><GitFork size={16} /> Discover on GitHub</Link>}
      />

      <div className="inbox-layout">
        <section className="source-workbench">
          <div className="workbench-step">
            <span>01</span>
            <div>
              <p className="section-kicker">Primary evidence</p>
              <h2>Bring the original source.</h2>
            </div>
          </div>
          <label className="url-field">
            <span>Public URL</span>
            <div>
              <Link2 size={17} />
              <input
                type="url"
                value={sourceUrl}
                onChange={(event) => {
                  setSourceUrl(event.target.value)
                  setFetched(false)
                  setSourceInfo(null)
                  setPreview(null)
                }}
                placeholder="https://…"
              />
              <button onClick={fetchUrl} disabled={fetching || !sourceUrl.trim()}>
                {fetching ? <LoaderCircle className="spin" size={16} /> : <FileSearch size={16} />}
                {fetching ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
          </label>
          <div className="source-divider"><span>or paste the source text</span></div>
          <div className="text-field">
            <span className="source-field-heading">
              <span>Source evidence {sourceTitle ? <em>{sourceTitle}</em> : null}</span>
              <span className="source-view-toggle">
                <button type="button" className={sourceView === 'rendered' ? 'selected' : ''} onClick={() => setSourceView('rendered')}>
                  <FileSearch size={13} /> Readable
                </button>
                <button type="button" className={sourceView === 'raw' ? 'selected' : ''} onClick={() => setSourceView('raw')}>
                  <TextCursorInput size={13} /> Edit raw
                </button>
              </span>
            </span>
            {sourceView === 'rendered' ? (
              <SourceTextPreview text={sourceText} />
            ) : (
              <textarea
                value={sourceText}
                onChange={(event) => {
                  setSourceText(event.target.value.slice(0, 30_000))
                  setPreview(null)
                }}
                placeholder="Paste the call, bounty, grant or challenge announcement here…"
              />
            )}
            <small>{sourceText.length.toLocaleString()} / 30,000 characters</small>
          </div>
          {sourceText ? (
            <dl className="source-facts-preview">
              <div><dt>Organizer</dt><dd>{detectedFacts.organizer || 'Not detected yet'}</dd></div>
              <div><dt>Deadline</dt><dd>{detectedFacts.deadline || 'Not detected yet'}</dd></div>
              <div><dt>Reward</dt><dd>{detectedFacts.reward || 'Not detected yet'}</dd></div>
            </dl>
          ) : null}
          {error ? <div className="inline-error"><AlertTriangle size={17} /> {error}</div> : null}
          {fetched ? (
            <div className="source-extraction-status">
              <div className="inline-success">
                <Check size={17} />
                Source extracted via {sourceInfo?.method.replace('-', ' ') ?? 'connector data'}
                {sourceInfo ? ` · ${sourceInfo.wordCount.toLocaleString()} words` : ''}. Review it before analysis.
              </div>
              {sourceInfo?.warnings.map((warning) => (
                <div className="inline-warning" key={warning}><AlertTriangle size={16} /> {warning}</div>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="analysis-panel">
          <div className="workbench-step">
            <span>02</span>
            <div>
              <p className="section-kicker">Structured analysis</p>
              <h2>Let GPT-5.6 find the constraints.</h2>
            </div>
          </div>
          {preview ? (
            <div className="normalized-preview">
              <div className="normalized-preview-status"><Check size={16} /> GPT-5.6 normalized · review before saving</div>
              <p className="section-kicker">{preview.organizer}</p>
              <h3>{preview.title}</h3>
              <p>{preview.summary}</p>
              <dl>
                <div>
                  <dt>Deadline</dt>
                  <dd className="deadline-moment">
                    <time dateTime={preview.deadline ?? undefined} title={preview.deadline ? `Source timestamp: ${preview.deadline}` : undefined}>
                      {formatDeadlineMoment(preview.deadline)}
                    </time>
                    {preview.deadline ? <span>your local time</span> : null}
                  </dd>
                </div>
                <div><dt>Reward</dt><dd>{preview.reward || 'Unknown'}</dd></div>
                <div><dt>Confidence</dt><dd>{preview.confidence}/100</dd></div>
                <div><dt>Evidence</dt><dd>{preview.evidence.length} source-backed items</dd></div>
              </dl>
              {preview.unknowns.length ? (
                <div className="preview-unknowns">
                  <strong>Still unknown</strong>
                  {preview.unknowns.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
                </div>
              ) : null}
              <div className="normalized-preview-actions">
                <button className="button secondary" onClick={() => setPreview(null)}>Analyze again</button>
                <button className="button primary" onClick={addPreview}>Add to opportunity pool <ArrowRight size={16} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="analysis-preview">
                <ScanSearch size={26} />
                <h3>What the model will produce</h3>
                <ul>
                  <li>Facts separated from inference</li>
                  <li>Deadline, timezone and eligibility</li>
                  <li>Requirements and submission cost</li>
                  <li>Unknowns and extraction confidence</li>
                  <li>Fit, hiddenness and strategic signals</li>
                </ul>
              </div>
              <div className="ai-guardrail">
                <Sparkles size={17} />
                <p><strong>One controlled AI operation</strong><span>Cached by content hash. No web-search tool calls.</span></p>
              </div>
              <button className="button primary analyze-button" onClick={analyze} disabled={analyzing || sourceText.trim().length < 80}>
                {analyzing ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                {analyzing ? 'Analyzing evidence…' : 'Analyze opportunity'}
                {!analyzing ? <ArrowRight size={17} /> : null}
              </button>
            </>
          )}
          {sourceUrl ? (
            <a className="source-external" href={sourceUrl} target="_blank" rel="noreferrer">
              Verify original source <ExternalLink size={15} />
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
