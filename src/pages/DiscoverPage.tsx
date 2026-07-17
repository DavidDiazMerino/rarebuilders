import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  GitFork,
  LoaderCircle,
  MessageSquare,
  Search,
  Tag,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { api, type GithubOpportunityCandidate } from '../lib/api'

const presets = [
  { label: 'Open bounties', query: 'is:issue is:open label:bounty no:assignee' },
  { label: 'Bounty posts', query: 'is:issue is:open in:title bounty no:assignee' },
  { label: 'AI agent rewards', query: 'is:issue is:open label:bounty "AI agent"' },
  { label: 'Build challenges', query: 'is:issue is:open in:title "build challenge"' },
]

export function DiscoverPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(presets[0].query)
  const [results, setResults] = useState<GithubOpportunityCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async (nextQuery = query) => {
    if (!nextQuery.trim()) return
    setLoading(true)
    setError('')
    setQuery(nextQuery)
    try {
      const response = await api.githubOpportunities(nextQuery)
      setResults(response.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'GitHub discovery failed.')
    } finally {
      setLoading(false)
    }
  }

  const inspect = (candidate: GithubOpportunityCandidate) => {
    window.sessionStorage.setItem('rarebuilders:github-candidate', JSON.stringify(candidate))
    navigate('/inbox?from=github')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live connector · GitHub"
        title="Search where opportunities look like work."
        description="RareBuilders treats public issues as candidates, not verified competitions. Select one to inspect the evidence and run the normal analysis flow."
      />

      <section className="discover-search">
        <div className="search-box">
          <GitFork size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter') void search()
          }} />
          <button onClick={() => void search()} disabled={loading || !query.trim()}>
            {loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}
            Search issues
          </button>
        </div>
        <div className="preset-row">
          {presets.map((preset) => (
            <button key={preset.label} onClick={() => void search(preset.query)}>{preset.label}</button>
          ))}
        </div>
        <p className="connector-note">Public GitHub REST search · open issues only · pull requests removed · results cached</p>
      </section>

      {error ? <div className="inline-error"><AlertTriangle size={17} /> {error}</div> : null}

      {!results.length && !loading ? (
        <section className="discover-empty">
          <GitFork size={30} />
          <h2>Run a focused search.</h2>
          <p>The connector brings back raw candidates. GPT-5.6 only runs after you choose one.</p>
        </section>
      ) : (
        <section className="candidate-list">
          {results.map((candidate) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-meta">
                <span><GitFork size={14} /> {candidate.repository}</span>
                <span><MessageSquare size={14} /> {candidate.comments} comments</span>
                <span>Updated {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(candidate.updatedAt))}</span>
              </div>
              <h2>{candidate.title}</h2>
              <p>{candidate.body.slice(0, 260) || 'No issue description was provided.'}{candidate.body.length > 260 ? '…' : ''}</p>
              <div className="candidate-footer">
                <div className="tag-row">
                  {candidate.labels.slice(0, 5).map((label) => <em key={label}><Tag size={12} /> {label}</em>)}
                </div>
                <div>
                  <a href={candidate.url} target="_blank" rel="noreferrer" className="icon-button" title="Open GitHub issue">
                    <ExternalLink size={16} />
                  </a>
                  <button className="button primary" onClick={() => inspect(candidate)}>
                    Inspect candidate <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
