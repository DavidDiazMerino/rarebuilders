import { Archive, Bookmark, CheckCircle2, ExternalLink, FileSearch, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAppState } from '../state/AppState'

type Tab = 'saved' | 'entered' | 'passed' | 'sources'

const decisionTabs: Array<{ id: Tab; label: string }> = [
  { id: 'saved', label: 'Saved' },
  { id: 'entered', label: 'Entered' },
  { id: 'passed', label: 'Passed' },
  { id: 'sources', label: 'Sources' },
]

export function LibraryPage() {
  const { data } = useAppState()
  const [tab, setTab] = useState<Tab>('saved')
  const latestFeedback = useMemo(() => {
    const latest = new Map<string, (typeof data.feedback)[number]>()
    for (const event of data.feedback) {
      if (event.kind === 'decision') latest.set(event.opportunityId, event)
    }
    return latest
  }, [data.feedback])
  const opportunities = tab === 'sources'
    ? []
    : data.opportunities.filter((opportunity) => {
        const action = latestFeedback.get(opportunity.id)?.action
        return action === tab
      })

  return (
    <div className="page">
      <PageHeader
        eyebrow="Decision library"
        title="What you kept, entered or walked away from."
        description="RareBuilders keeps the latest decision visible while preserving the history that shaped your profile."
      />
      <div className="library-tabs" role="tablist">
        {decisionTabs.map((item) => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'sources' ? (
        <section className="library-list">
          {data.candidates.map((candidate) => (
            <article className="library-row" key={candidate.id}>
              <span className={`candidate-state ${candidate.status}`}>{candidate.status}</span>
              <div>
                <small>{candidate.connector} · {candidate.organizer}</small>
                <h2>{candidate.title}</h2>
                <p>{candidate.summary || 'No source summary available.'}</p>
              </div>
              {candidate.canonicalUrl ? (
                <a href={candidate.canonicalUrl} target="_blank" rel="noreferrer" className="icon-button" title="Open source">
                  <ExternalLink size={16} />
                </a>
              ) : null}
            </article>
          ))}
          {!data.candidates.length ? (
            <div className="mini-empty"><FileSearch size={22} /><p>No source history yet. Discover or add one to start.</p></div>
          ) : null}
        </section>
      ) : (
        <section className="library-list">
          {opportunities.map((opportunity) => {
            const event = latestFeedback.get(opportunity.id)
            return (
              <article className="library-row" key={opportunity.id}>
                <span className={`library-decision ${event?.action}`}>
                  {event?.action === 'entered'
                    ? <CheckCircle2 size={16} />
                    : event?.action === 'passed'
                      ? <XCircle size={16} />
                      : <Bookmark size={16} />}
                </span>
                <div>
                  <small>{opportunity.organizer} · {event?.action}</small>
                  <h2><Link to={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h2>
                  <p>{event?.note || (event?.reasonCode ? `Reason: ${event.reasonCode}` : opportunity.summary)}</p>
                </div>
              </article>
            )
          })}
          {!opportunities.length ? (
            <div className="mini-empty"><Archive size={22} /><p>Nothing in this decision state yet.</p></div>
          ) : null}
        </section>
      )}
    </div>
  )
}
