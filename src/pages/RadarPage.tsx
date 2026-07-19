import { CheckCircle2, EyeOff, FilePlus2, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
    opportunityTitle: string
    kind: FeedbackKind
    action: FeedbackAction
  } | null>(null)
  const [showDemoGuide, setShowDemoGuide] = useState(false)
  useEffect(() => {
    if (data.mode !== 'demo' || window.sessionStorage.getItem('rarebuilders:demo-guide-seen')) return
    setShowDemoGuide(true)
  }, [data.mode])
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
  const passedOpportunities = data.opportunities.filter((opportunity) =>
    feedbackByOpportunity.get(`${opportunity.id}:decision`) === 'passed')
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
      {showDemoGuide ? (
        <section className="demo-guide" aria-label="Demo walkthrough">
          <div>
            <span>Quick demo · 60 seconds</span>
            <h2>This is David’s populated example, so you can test the product before creating a profile.</h2>
          </div>
          <ol>
            <li><strong>Open a dossier</strong><span>See why one opportunity fits this builder.</span></li>
            <li><strong>Teach the radar</strong><span>Try More like this or Pass and watch the feedback state.</span></li>
            <li><strong>Add a real source</strong><span>Live evidence replaces illustrative opportunity cards.</span></li>
          </ol>
          <button onClick={() => {
            window.sessionStorage.setItem('rarebuilders:demo-guide-seen', '1')
            setShowDemoGuide(false)
          }}><CheckCircle2 size={15} /> Got it, explore</button>
        </section>
      ) : null}
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
        <div className={`pool-confirmation feedback-confirmation ${feedbackNotice.action}`} role="status">
          {feedbackNotice.kind === 'preference' ? <Sparkles size={16} /> : <EyeOff size={16} />}
          <span>
            <strong>{feedbackNotice.action === 'passed' ? 'Hidden from today’s radar.' : 'Preference learned.'}</strong>
            {feedbackNotice.action === 'passed'
              ? ` “${feedbackNotice.opportunityTitle}” is kept below and in Library in case this was accidental.`
              : ` Domains from “${feedbackNotice.opportunityTitle}” will receive more weight in this browser’s future rankings.`}
          </span>
          <button onClick={() => {
            undoFeedback(feedbackNotice.opportunityId, feedbackNotice.kind)
            setFeedbackNotice(null)
          }}>Undo</button>
          {feedbackNotice.kind === 'preference' ? <Link to="/profile">See learned signals</Link> : null}
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
              setFeedbackNotice({
                opportunityId: item.opportunity.id,
                opportunityTitle: item.opportunity.title,
                kind,
                action,
              })
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
      {passedOpportunities.length ? (
        <section className="passed-tray" aria-label="Passed opportunities">
          <div>
            <EyeOff size={16} />
            <span><strong>{passedOpportunities.length} passed</strong>Hidden from the active radar, retained for recovery.</span>
            <Link to="/library">Review passed items</Link>
          </div>
          {passedOpportunities.slice(-3).map((opportunity) => (
            <div key={opportunity.id}>
              <span><strong>{opportunity.title}</strong>{opportunity.organizer}</span>
              <button onClick={() => {
                undoFeedback(opportunity.id, 'decision')
                if (feedbackNotice?.opportunityId === opportunity.id) setFeedbackNotice(null)
              }}>Undo pass</button>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}
