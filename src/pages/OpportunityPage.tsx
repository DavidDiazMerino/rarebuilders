import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  EyeOff,
  ExternalLink,
  Flag,
  MoreHorizontal,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { FeedbackReason } from '../../shared/domain'
import { ScoreBar } from '../components/ScoreBar'
import { api } from '../lib/api'
import { deadlineDistance, formatDeadline } from '../lib/format'
import { scoreDescriptions } from '../lib/score-descriptions'
import { evaluateOpportunity, verdictLabel } from '../lib/scoring'
import { useAppState } from '../state/AppState'

export function OpportunityPage() {
  const { opportunityId } = useParams()
  const [searchParams] = useSearchParams()
  const { data, recordFeedback, saveStrategy } = useAppState()
  const opportunity = data.opportunities.find((item) => item.id === opportunityId)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [passReason, setPassReason] = useState<FeedbackReason>('time')
  const [decisionNote, setDecisionNote] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const evaluation = useMemo(
    () => opportunity ? evaluateOpportunity(data.profile, opportunity) : null,
    [data.profile, opportunity],
  )

  if (!opportunity || !evaluation) {
    return (
      <div className="page">
        <Link className="back-link" to="/radar"><ArrowLeft size={16} /> Back to radar</Link>
        <section className="empty-state"><h1>Opportunity not found.</h1></section>
      </div>
    )
  }

  const strategy = data.strategies[opportunity.id]
  const currentDecision = [...data.feedback].reverse().find((event) =>
    event.opportunityId === opportunity.id && event.kind === 'decision')
  const currentPreference = [...data.feedback].reverse().find((event) =>
    event.opportunityId === opportunity.id && event.kind === 'preference')
  const hasPublicSource = /^https?:\/\//i.test(opportunity.sourceUrl)
  const illustrative = opportunity.provenance.mode === 'illustrative'
  const matchedProjects = evaluation.matchedProjectIds
    .map((id) => data.profile.projects.find((project) => project.id === id))
    .filter((project) => project !== undefined)

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const result = await api.generateStrategy({ opportunity, profile: data.profile })
      saveStrategy(opportunity.id, result.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Strategy generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="page dossier-page">
      <Link className="back-link" to="/radar"><ArrowLeft size={16} /> Back to today’s radar</Link>
      {searchParams.get('added') === '1' ? (
        <div className="pool-confirmation">
          <CheckCircle2 size={17} />
          <span>
            <strong>Added to your opportunity pool.</strong>
            {searchParams.get('rank') === 'outside'
              ? ' It did not enter today’s five picks yet.'
              : ` It currently ranks #${searchParams.get('rank')} in today’s radar.`}
          </span>
        </div>
      ) : null}

      <header className="dossier-header">
        <div>
          <div className="dossier-topline">
            <span className={illustrative ? 'data-label demo' : 'data-label live'}>
              {illustrative ? 'Illustrative sample' : 'Live evidence · normalized'}
            </span>
            <span>{opportunity.region} · {opportunity.language}</span>
          </div>
          <p className="section-kicker">{opportunity.organizer}</p>
          <h1>{opportunity.title}</h1>
          <p className="dossier-summary">{opportunity.summary}</p>
        </div>
        <div className="decision-stamp">
          <span>Recommendation</span>
          <strong>{verdictLabel[evaluation.verdict]}</strong>
          <small>{evaluation.overall}/100 personal edge</small>
        </div>
      </header>

      <section className="facts-strip">
        <div><Clock3 size={17} /><span><small>Deadline</small><strong>{formatDeadline(opportunity.deadline)}</strong></span></div>
        <div><AlertTriangle size={17} /><span><small>Urgency</small><strong>{deadlineDistance(opportunity.deadline)}</strong></span></div>
        <div><Trophy size={17} /><span><small>Reward</small><strong>{opportunity.reward || 'Not confirmed'}</strong></span></div>
        <div><CheckCircle2 size={17} /><span><small>Confidence</small><strong>{evaluation.confidence}/100</strong></span></div>
        {hasPublicSource ? (
          <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} /><span>
              <small>{opportunity.provenance.evidenceRole === 'primary' ? 'Official opportunity page' : 'Example discovery pattern'}</small>
              <strong>{opportunity.provenance.evidenceRole === 'primary' ? 'View original contest' : 'View similar source type'}</strong>
            </span>
          </a>
        ) : (
          <div><ExternalLink size={17} /><span>
            <small>{illustrative ? 'Evidence status' : 'Source evidence'}</small>
            <strong>{illustrative ? 'Illustrative only' : 'Pasted evidence'}</strong>
          </span></div>
        )}
      </section>
      {illustrative && opportunity.provenance.evidenceRole === 'reference-pattern' ? (
        <div className="illustrative-source-note">
          <AlertTriangle size={16} />
          <span>
            <strong>This demo opportunity is fictional.</strong>
            The external link demonstrates where this kind of opportunity may be discovered; it is not the page for this specific contest.
          </span>
        </div>
      ) : null}

      <div className="dossier-grid">
        <div className="dossier-main">
          <section className="dossier-section">
            <div className="section-heading">
              <div><p className="section-kicker">Decision</p><h2>The case for your time</h2></div>
              <span className="confidence-note">Scores are heuristics, not win probabilities.</span>
            </div>
            <div className="argument-columns">
              <div className="argument positive">
                <h3>Why this could work</h3>
                <ul>{evaluation.reasonsFor.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </div>
              <div className="argument negative">
                <h3>Why you may walk away</h3>
                <ul>{evaluation.reasonsAgainst.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </div>
            </div>
          </section>

          <section className="dossier-section">
            <div className="section-heading">
              <div><p className="section-kicker">Builder leverage</p><h2>What you already own</h2></div>
            </div>
            {matchedProjects.length ? (
              <div className="project-match-list">
                {matchedProjects.map((project) => (
                  <article key={project.id}>
                    <span>{project.status}</span>
                    <h3>{project.name}</h3>
                    <p>{project.summary}</p>
                    <div className="tag-row">{project.reusableAssets.map((asset) => <em key={asset}>{asset}</em>)}</div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No existing project has a strong documented match. That is useful negative evidence.</p>
            )}
          </section>

          <section className="dossier-section strategy-section">
            <div className="section-heading">
              <div><p className="section-kicker">GPT-5.6 strategy</p><h2>Turn the signal into a build</h2></div>
              <button className="button primary" onClick={generate} disabled={generating}>
                <Sparkles size={16} /> {generating ? 'Generating…' : strategy ? 'Regenerate' : 'Generate strategy'}
              </button>
            </div>
            {error ? <div className="inline-error"><AlertTriangle size={17} /> {error}</div> : null}
            {strategy ? (
              <div className="strategy-output">
                <span className="ai-label">{strategy.model}</span>
                <h3>{strategy.headline}</h3>
                <p>{strategy.angle}</p>
                <div className="strategy-columns">
                  <div><strong>Leverage</strong><ul>{strategy.leverage.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div><strong>Risks</strong><ul>{strategy.risks.map((item) => <li key={item}>{item}</li>)}</ul></div>
                </div>
                <ol className="first-steps">{strategy.firstSteps.map((step) => <li key={step}>{step}</li>)}</ol>
              </div>
            ) : (
              <p className="muted-copy">Generate a tailored angle only when this opportunity survives the first decision pass.</p>
            )}
          </section>

          <section className="dossier-section">
            <div className="section-heading">
              <div><p className="section-kicker">Source record</p><h2>Facts, inference and unknowns</h2></div>
            </div>
            <div className="evidence-table">
              {opportunity.evidence.map((item) => (
                <div key={`${item.label}-${item.value}`}>
                  <span className={`evidence-kind ${item.kind}`}>{item.kind}</span>
                  <strong>{item.label}</strong>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
            {opportunity.unknowns.length ? (
              <div className="unknowns"><strong>Still unknown</strong>{opportunity.unknowns.map((item) => <span key={item}>{item}</span>)}</div>
            ) : null}
          </section>
        </div>

        <aside className="dossier-sidebar">
          <section className="scorecard">
            <p className="section-kicker">Signal stack</p>
            <p className={`verification-status ${evaluation.verificationStatus}`}>
              {evaluation.verificationStatus.replace('-', ' ')}
            </p>
            <ScoreBar label="Personal fit" value={evaluation.fit} tone="acid" description={scoreDescriptions.fit} />
            <ScoreBar label="Win signal" value={evaluation.winSignal} description={scoreDescriptions.winSignal} />
            <ScoreBar label="Hiddenness" value={evaluation.hiddenness} tone="warm" description={scoreDescriptions.hiddenness} />
            <div className="hiddenness-breakdown">
              <span>{evaluation.hiddennessConfidence}% signal confidence</span>
              {evaluation.hiddennessFactors.map((factor) => (
                <p key={factor.label}>
                  <strong>{factor.impact > 0 ? '+' : ''}{factor.impact}</strong>
                  {factor.evidence}
                </p>
              ))}
            </div>
            <ScoreBar label="Strategic value" value={evaluation.strategicValue} description={scoreDescriptions.strategicValue} />
            <ScoreBar label="Effort fit" value={evaluation.effortFit} description={scoreDescriptions.effortFit} />
            <ScoreBar label="Risk" value={evaluation.risk} tone="warm" description={scoreDescriptions.risk} />
            <details className="score-explanation">
              <summary>How every score was calculated</summary>
              {([
                ['Fit', evaluation.fitFactors],
                ['Win signal', evaluation.winFactors],
                ['Strategic value', evaluation.strategicFactors],
                ['Effort fit', evaluation.effortFactors],
                ['Risk', evaluation.riskFactors],
              ] as const).map(([label, factors]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  {factors.map((scoreFactor) => (
                    <p key={`${label}-${scoreFactor.label}`}>
                      <span>{scoreFactor.label}</span>
                      <em>{scoreFactor.impact > 0 ? '+' : ''}{scoreFactor.impact}</em>
                      <small>{scoreFactor.evidence}</small>
                    </p>
                  ))}
                </div>
              ))}
            </details>
          </section>
          <section className="requirements-card">
            <p className="section-kicker">Participation cost</p>
            <strong>{opportunity.effortHours > 0 ? `${opportunity.effortHours} estimated hours` : 'Effort unknown'}</strong>
            <dl className="participation-facts">
              <div><dt>Application burden</dt><dd>{opportunity.applicationBurden}</dd></div>
              <div><dt>Can enter as</dt><dd>{opportunity.participationModes.join(' · ')}</dd></div>
              <div><dt>Eligibility</dt><dd>{opportunity.eligibility.length ? opportunity.eligibility.join(' · ') : 'Not confirmed'}</dd></div>
              {opportunity.entityRequirements.length ? (
                <div><dt>Entity needed</dt><dd>{opportunity.entityRequirements.join(' · ')}</dd></div>
              ) : null}
            </dl>
            <h3>Requirements</h3>
            {opportunity.requirements.length
              ? <ul>{opportunity.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
              : <p className="muted-copy">No requirements extracted yet.</p>}
            <h3>Deliverables</h3>
            {opportunity.deliverables.length
              ? <ul>{opportunity.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
              : <p className="muted-copy">No deliverables extracted yet.</p>}
          </section>
          <section className="sidebar-actions">
            <p className="section-kicker">My decision</p>
            {feedbackMessage ? <p className="sidebar-feedback" role="status">{feedbackMessage}</p> : null}
            <button className={currentDecision?.action === 'saved' ? 'selected' : ''} onClick={() => {
              recordFeedback(opportunity, 'decision', 'saved')
              setFeedbackMessage('Saved to Library.')
            }}>
              <Bookmark size={16} /> Save
            </button>
            <button className={currentDecision?.action === 'entered' ? 'selected' : ''} onClick={() => recordFeedback(opportunity, 'decision', 'entered')}>
              <Flag size={16} /> I entered
            </button>
            <button className={currentDecision?.action === 'passed' ? 'selected' : ''} onClick={() => setRejecting((value) => !value)}>
              <EyeOff size={16} /> Not for me
            </button>
            {rejecting ? (
              <div className="decision-reason">
                <label htmlFor="pass-reason">Main reason</label>
                <select
                  id="pass-reason"
                  value={passReason}
                  onChange={(event) => setPassReason(event.target.value as FeedbackReason)}
                >
                  <option value="time">Too much time</option>
                  <option value="reward">Reward is not worth it</option>
                  <option value="eligibility">Eligibility does not fit</option>
                  <option value="team">Team requirements</option>
                  <option value="deadline">Deadline is too close</option>
                  <option value="source-trust">I do not trust the source yet</option>
                  <option value="domain-fit">Wrong domain for me</option>
                  <option value="other">Something else</option>
                </select>
                <textarea
                  value={decisionNote}
                  onChange={(event) => setDecisionNote(event.target.value.slice(0, 500))}
                  placeholder="Optional private note — never sent to the model."
                />
                <button onClick={() => {
                  recordFeedback(
                    opportunity,
                    'decision',
                    'passed',
                    passReason,
                    decisionNote.trim() || undefined,
                  )
                  setRejecting(false)
                  setFeedbackMessage('Passed and hidden from today’s radar. You can recover it from Library.')
                }}>Confirm pass</button>
              </div>
            ) : null}
            <p className="section-kicker">Teach the radar</p>
            <button className={currentPreference?.action === 'more-like' ? 'selected' : ''} onClick={() => {
              recordFeedback(opportunity, 'preference', 'more-like')
              setFeedbackMessage('Preference learned. Similar domains will rank higher in future results.')
            }}>
              <MoreHorizontal size={16} /> More like this
            </button>
            <button className={currentPreference?.action === 'less-like' ? 'selected' : ''} onClick={() => {
              recordFeedback(opportunity, 'preference', 'less-like')
              setFeedbackMessage('Preference learned. Similar domains will rank lower in future results.')
            }}>
              <EyeOff size={16} /> Less like this
            </button>
            {hasPublicSource ? (
              <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">
                {opportunity.provenance.evidenceRole === 'primary' ? 'Open official opportunity' : 'Open example source pattern'}
                <ArrowUpRight size={16} />
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  )
}
