import { ArrowUpRight, Bookmark, Check, EyeOff, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FeedbackAction, RadarItem } from '../../shared/domain'
import { deadlineDistance, formatDeadline, sourceKindLabel } from '../lib/format'
import { verdictLabel } from '../lib/scoring'

export function OpportunityCard({
  item,
  currentFeedback,
  onFeedback,
}: {
  item: RadarItem
  currentFeedback?: FeedbackAction
  onFeedback: (action: FeedbackAction) => void
}) {
  const { opportunity, evaluation, bucket } = item
  return (
    <article className="opportunity-card">
      <div className="opportunity-card-topline">
        <span className={`bucket-label ${bucket}`}>{bucket}</span>
        <span className={opportunity.fixture ? 'data-label demo' : 'data-label live'}>
          {opportunity.fixture ? 'Demo dataset' : 'Live source'}
        </span>
      </div>
      <div className="opportunity-card-heading">
        <div>
          <p className="card-source">{opportunity.organizer} · {sourceKindLabel(opportunity.sourceKind)}</p>
          <h2><Link to={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h2>
        </div>
        <div className="overall-score" aria-label={`Overall score ${evaluation.overall}`}>
          <strong>{evaluation.overall}</strong>
          <span>edge</span>
        </div>
      </div>
      <p className="card-summary">{opportunity.summary}</p>
      <div className="deadline-row">
        <span>{formatDeadline(opportunity.deadline)}</span>
        <strong>{deadlineDistance(opportunity.deadline)}</strong>
        <span>{opportunity.effortHours}h estimated</span>
      </div>
      <div className="mini-scores">
        <span>Fit <strong>{evaluation.fit}</strong></span>
        <span>Win signal <strong>{evaluation.winSignal}</strong></span>
        <span>Hiddenness <strong>{evaluation.hiddenness}</strong></span>
        <span>Confidence <strong>{evaluation.confidence}</strong></span>
      </div>
      <div className="recommendation-line">
        <span className={`verdict ${evaluation.verdict}`}>{verdictLabel[evaluation.verdict]}</span>
        <p>{evaluation.reasonsFor[0]}</p>
      </div>
      <footer className="card-actions">
        <button
          className={currentFeedback === 'saved' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('saved')}
        >
          {currentFeedback === 'saved' ? <Check size={15} /> : <Bookmark size={15} />}
          Save
        </button>
        <button
          className={currentFeedback === 'rejected' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('rejected')}
        >
          <EyeOff size={15} /> Not for me
        </button>
        <button
          className={currentFeedback === 'more-like-this' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('more-like-this')}
        >
          <MoreHorizontal size={15} /> More like this
        </button>
        <Link className="open-link" to={`/opportunities/${opportunity.id}`}>
          Open dossier <ArrowUpRight size={16} />
        </Link>
      </footer>
    </article>
  )
}
