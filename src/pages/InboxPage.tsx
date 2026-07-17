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
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Opportunity } from '../../shared/domain'
import { PageHeader } from '../components/PageHeader'
import { api, type GithubOpportunityCandidate } from '../lib/api'
import { useAppState } from '../state/AppState'

export function InboxPage() {
  const { data, addOpportunity } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [fetching, setFetching] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState(false)
  const [preview, setPreview] = useState<Opportunity | null>(null)

  useEffect(() => {
    if (!location.search.includes('from=github')) return
    const raw = window.sessionStorage.getItem('rarebuilders:github-candidate')
    if (!raw) return
    try {
      const candidate = JSON.parse(raw) as GithubOpportunityCandidate
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
      window.sessionStorage.removeItem('rarebuilders:github-candidate')
    } catch {
      window.sessionStorage.removeItem('rarebuilders:github-candidate')
    }
  }, [location.search])

  const fetchUrl = async () => {
    if (!sourceUrl.trim()) return
    setFetching(true)
    setError('')
    try {
      const result = await api.fetchSource(sourceUrl.trim())
      setSourceUrl(result.data.url)
      setSourceTitle(result.data.title)
      setSourceText(result.data.text)
      setFetched(true)
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
        profile: data.profile,
      })
      const opportunity: Opportunity = {
        ...result.data,
        id: crypto.randomUUID(),
        discoveredAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        fixture: false,
      }
      setPreview(opportunity)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'GPT-5.6 analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const addPreview = () => {
    if (!preview) return
    addOpportunity(preview)
    navigate(`/opportunities/${preview.id}`)
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
          <label className="text-field">
            <span>Source text {sourceTitle ? <em>{sourceTitle}</em> : null}</span>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value.slice(0, 30_000))}
              placeholder="Paste the call, bounty, grant or challenge announcement here…"
            />
            <small>{sourceText.length.toLocaleString()} / 30,000 characters</small>
          </label>
          {error ? <div className="inline-error"><AlertTriangle size={17} /> {error}</div> : null}
          {fetched ? <div className="inline-success"><Check size={17} /> Source extracted. Review it before analysis.</div> : null}
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
                <div><dt>Deadline</dt><dd>{preview.deadline ?? 'Unknown'}</dd></div>
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
                <button className="button primary" onClick={addPreview}>Add to radar <ArrowRight size={16} /></button>
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
