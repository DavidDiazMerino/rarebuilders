import { FilePlus2, SlidersHorizontal } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { OpportunityCard } from '../components/OpportunityCard'
import { PageHeader } from '../components/PageHeader'
import { buildRadar } from '../lib/scoring'
import { useAppState } from '../state/AppState'

export function RadarPage() {
  const { data, recordFeedback } = useAppState()
  const radar = useMemo(
    () => buildRadar(data.profile, data.opportunities, data.feedback),
    [data.profile, data.opportunities, data.feedback],
  )
  const feedbackByOpportunity = new Map(data.feedback.map((event) => [event.opportunityId, event.action]))
  const date = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="page">
      <PageHeader
        eyebrow={date}
        title="Five opportunities worth your attention."
        description={`Built around ${data.profile.name}’s ${data.profile.weeklyHours}-hour week, existing projects and appetite for asymmetric bets.`}
        actions={(
          <>
            <Link className="button secondary" to="/profile"><SlidersHorizontal size={16} /> Tune profile</Link>
            <Link className="button primary" to="/inbox"><FilePlus2 size={16} /> Add source</Link>
          </>
        )}
      />

      <section className="radar-summary" aria-label="Radar distribution">
        <div>
          <span className="summary-count practical">2</span>
          <p><strong>Practical</strong><small>High fit, manageable cost</small></p>
        </div>
        <div>
          <span className="summary-count rare">2</span>
          <p><strong>Rare</strong><small>Hidden, plausible advantage</small></p>
        </div>
        <div>
          <span className="summary-count wildcard">1</span>
          <p><strong>Wildcard</strong><small>Outside the obvious lane</small></p>
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
            currentFeedback={feedbackByOpportunity.get(item.opportunity.id)}
            onFeedback={(action) => recordFeedback(item.opportunity, action)}
          />
        )) : (
          <section className="empty-state">
            <h2>Your radar is quiet.</h2>
            <p>You rejected every current candidate. Add a source or reset your preferences to keep exploring.</p>
            <Link className="button primary" to="/discover">Discover on GitHub</Link>
          </section>
        )}
      </div>
    </div>
  )
}
