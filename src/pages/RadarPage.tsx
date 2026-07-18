import { FilePlus2, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeedbackAction, FeedbackKind } from '../../shared/domain'
import { OpportunityCard } from '../components/OpportunityCard'
import { PageHeader } from '../components/PageHeader'
import { buildRadar } from '../lib/scoring'
import { useAppState } from '../state/AppState'

export function RadarPage() {
  const { data, recordFeedback, undoFeedback } = useAppState()
  const [feedbackNotice, setFeedbackNotice] = useState<{
    opportunityId: string
    kind: FeedbackKind
    action: FeedbackAction
  } | null>(null)
  const radar = useMemo(
    () => buildRadar(data.profile, data.opportunities, data.feedback),
    [data.profile, data.opportunities, data.feedback],
  )
  const feedbackByOpportunity = new Map(
    data.feedback.map((event) => [`${event.opportunityId}:${event.kind}`, event.action]),
  )
  const bucketSummary = (bucket: 'practical' | 'rare' | 'wildcard') => {
    const items = radar.filter((item) => item.bucket === bucket)
    return {
      count: items.length,
      closest: items.filter((item) => item.bucketMatch === 'closest').length,
    }
  }
  const practical = bucketSummary('practical')
  const rare = bucketSummary('rare')
  const wildcard = bucketSummary('wildcard')
  const liveCount = data.opportunities.filter((opportunity) => opportunity.provenance.mode === 'live').length
  const illustrativeCount = data.opportunities.length - liveCount
  const usingLiveOnly = liveCount > 0 && illustrativeCount > 0
  const date = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="page">
      <PageHeader
        eyebrow={date}
        title={radar.length === 5
          ? 'Five opportunities worth your attention.'
          : radar.length === 1
            ? 'One opportunity worth your attention.'
            : `${radar.length || 'No'} opportunities worth your attention.`}
        description={`Built around ${data.profile.name}’s ${data.profile.weeklyHours}-hour week, existing projects and appetite for asymmetric bets.`}
        actions={(
          <>
            <Link className="button secondary" to="/profile"><SlidersHorizontal size={16} /> Tune profile</Link>
            <Link className="button primary" to="/inbox"><FilePlus2 size={16} /> Add source</Link>
          </>
        )}
      />
      {usingLiveOnly ? (
        <div className="pool-confirmation live-pool-notice" role="status">
          <span>
            <strong>Live radar active.</strong> You added {liveCount} live source{liveCount === 1 ? '' : 's'},
            so {illustrativeCount} sample pattern{illustrativeCount === 1 ? ' is' : 's are'} hidden rather than mixed into a real decision.
            {liveCount < 5 ? ` Add ${5 - liveCount} more live source${5 - liveCount === 1 ? '' : 's'} to rebuild a full five-item radar.` : ''}
          </span>
          <Link to="/inbox">Add live source</Link>
        </div>
      ) : null}
      {feedbackNotice ? (
        <div className="pool-confirmation" role="status">
          <span>
            Feedback saved: <strong>{feedbackNotice.action.replace('-', ' ')}</strong>.
            Your private note and preferences are never sent to GPT.
          </span>
          <button onClick={() => {
            undoFeedback(feedbackNotice.opportunityId, feedbackNotice.kind)
            setFeedbackNotice(null)
          }}>Undo</button>
        </div>
      ) : null}

      <section className="radar-summary" aria-label="Radar distribution">
        <div>
          <span className="summary-count practical">{practical.count}</span>
          <p><strong>Practical</strong><small>{practical.closest ? `${practical.closest} closest available` : 'High fit, manageable cost'}</small></p>
        </div>
        <div>
          <span className="summary-count rare">{rare.count}</span>
          <p><strong>Rare</strong><small>{rare.closest ? `${rare.closest} closest available` : 'Hidden, plausible advantage'}</small></p>
        </div>
        <div>
          <span className="summary-count wildcard">{wildcard.count}</span>
          <p><strong>Wildcard</strong><small>{wildcard.closest ? `${wildcard.closest} closest available` : 'Outside the obvious lane'}</small></p>
        </div>
        <aside>
          <span>Today’s thesis</span>
          <p>Visibility is not the same as value. The strongest pick may have a smaller prize and a better reuse path.</p>
        </aside>
      </section>

      <div className="radar-list">
        {radar.length ? radar.map((item) => (
          <OpportunityCard
            key={item.opportunity.id}
            item={item}
            currentDecision={feedbackByOpportunity.get(`${item.opportunity.id}:decision`)}
            currentPreference={feedbackByOpportunity.get(`${item.opportunity.id}:preference`)}
            onFeedback={(kind, action) => {
              recordFeedback(
                item.opportunity,
                kind,
                action,
                kind === 'decision' && action === 'passed' ? 'other' : undefined,
              )
              setFeedbackNotice({ opportunityId: item.opportunity.id, kind, action })
            }}
          />
        )) : (
          <section className="empty-state">
            <h2>Your radar is quiet.</h2>
            <p>You passed every current candidate. Add a source or reset your preferences to keep exploring.</p>
            <Link className="button primary" to="/discover">Discover on GitHub</Link>
          </section>
        )}
      </div>
    </div>
  )
}
