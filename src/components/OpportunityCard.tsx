import { ArrowUpRight, Bookmark, Check, EyeOff, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { FeedbackAction, RadarItem } from '../../shared/domain'
import { deadlineDistance, formatDeadline, sourceKindLabel } from '../lib/format'
import { scoreDescriptions } from '../lib/score-descriptions'
import { verdictLabel } from '../lib/scoring'
import { ScoreHint } from './ScoreHint'

export function OpportunityCard({
  item,
  currentDecision,
  currentPreference,
  onFeedback,
}: {
  item: RadarItem
  currentDecision?: FeedbackAction
  currentPreference?: FeedbackAction
  onFeedback: (kind: 'decision' | 'preference', action: FeedbackAction) => void
}) {
  const { opportunity, evaluation, bucket, bucketMatch } = item
  const illustrative = opportunity.provenance.mode === 'illustrative'
  return (
    <article className="opportunity-card">
      <div className="opportunity-card-topline">
        <span className={`bucket-label ${bucket}`}>{bucket}</span>
        {bucketMatch === 'closest' ? <span className="bucket-fit">Closest available</span> : null}
        <span className={illustrative ? 'data-label demo' : 'data-label live'}>
          {illustrative ? 'Illustrative sample' : 'Live evidence'}
        </span>
      </div>
      <div className="opportunity-card-heading">
        <div>
          <p className="card-source">{opportunity.organizer} · {sourceKindLabel(opportunity.sourceKind)}</p>
          <h2><Link to={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h2>
        </div>
        <div className="overall-score" aria-label={`Personal edge ${evaluation.overall} out of 100`}>
          <strong>{evaluation.overall}</strong>
          <ScoreHint label="edge" description={scoreDescriptions.edge} />
        </div>
      </div>
      <p className="card-summary">{opportunity.summary}</p>
      <div className="deadline-row">
        <span>{formatDeadline(opportunity.deadline)}</span>
        <strong>{deadlineDistance(opportunity.deadline)}</strong>
        <span>{opportunity.effortHours > 0 ? `${opportunity.effortHours}h estimated` : 'Effort unknown'}</span>
      </div>
      <p className="card-reward"><span>Reward</span>{opportunity.reward || 'Not confirmed'}</p>
      <div className="mini-scores">
        <span><ScoreHint label="Fit" description={scoreDescriptions.fit} /> <strong>{evaluation.fit}</strong></span>
        <span><ScoreHint label="Win signal" description={scoreDescriptions.winSignal} /> <strong>{evaluation.winSignal}</strong></span>
        <span><ScoreHint label="Hiddenness" description={scoreDescriptions.hiddenness} /> <strong>{evaluation.hiddenness}</strong></span>
        <span><ScoreHint label="Confidence" description={scoreDescriptions.confidence} /> <strong>{evaluation.confidence}</strong></span>
      </div>
      <div className="recommendation-line">
        <span className={`verdict ${evaluation.verdict}`}>{verdictLabel[evaluation.verdict]}</span>
        <p>{evaluation.reasonsFor[0]}</p>
      </div>
      <footer className="card-actions">
        <button
          className={currentDecision === 'saved' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('decision', 'saved')}
        >
          {currentDecision === 'saved' ? <Check size={15} /> : <Bookmark size={15} />}
          Save
        </button>
        <button
          className={currentDecision === 'passed' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('decision', 'passed')}
        >
          <EyeOff size={15} /> Pass
        </button>
        <button
          className={currentPreference === 'more-like' ? 'compact-action selected' : 'compact-action'}
          onClick={() => onFeedback('preference', 'more-like')}
        >
          <Sparkles size={15} /> More like this
        </button>
        <Link className="open-link" to={`/opportunities/${opportunity.id}`}>
          Open dossier <ArrowUpRight size={16} />
        </Link>
      </footer>
    </article>
  )
}
