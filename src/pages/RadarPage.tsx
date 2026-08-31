import { Activity, EyeOff, FilePlus2, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeedbackAction, FeedbackKind } from '../../shared/domain'
import { OpportunityCard } from '../components/OpportunityCard'
import { PageHeader } from '../components/PageHeader'
import { demoSnapshotTime } from '../data/fixtures'
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
  const hasLiveOpportunities = data.opportunities.some((opportunity) => opportunity.provenance.mode === 'live')
  const referenceDate = useMemo(
    () => hasLiveOpportunities ? new Date() : new Date(demoSnapshotTime),
    [hasLiveOpportunities],
  )
  const radar = useMemo(
    () => buildRadar(
      data.profile,
      data.opportunities,
      data.feedback,
      referenceDate,
    ),
    [data.profile, data.opportunities, data.feedback, referenceDate],
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
  const latestDigest = data.digests[0]

  return (
    <div className="page">
      <PageHeader
        eyebrow={date}
        title={!hasLiveOpportunities
          ? 'Five patterns shaping your opportunity model.'
          : radar.length === 5
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
      {latestDigest ? (
        <section className="scan-digest" aria-label="Latest source scan">
          <Activity size={18} />
          <div>
            <span>Latest twice-weekly scan</span>
            <strong>{latestDigest.newSignals} changed signals · {latestDigest.promotedSignals} promoted · {latestDigest.analysesUsed} GPT analyses</strong>
            <small>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(latestDigest.generatedAt))}{latestDigest.sourceErrors ? ` · ${latestDigest.sourceErrors} source issue${latestDigest.sourceErrors === 1 ? '' : 's'}` : ''}</small>
          </div>
          <Link to="/operations">Open operations</Link>
        </section>
      ) : null}
      {!hasLiveOpportunities ? (
        <div className="reference-layer-note">
          <span>Reference layer</span>
          <p><strong>Showing five decision patterns while the live source radar warms up.</strong> They exercise your ranking and feedback model, but are not current calls.</p>
          <Link to="/operations">Check live-source status</Link>
        </div>
      ) : null}
      {usingLiveOnly ? (
        <div className="pool-confirmation live-pool-notice" role="status">
          <span>
            <strong>Live radar active.</strong> You added {liveCount} live source{liveCount === 1 ? '' : 's'},
            so {illustrativeCount} reference pattern{illustrativeCount === 1 ? ' is' : 's are'} hidden rather than mixed into a real decision.
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
            referenceDate={referenceDate}
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
