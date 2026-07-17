import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ScoreBar } from '../components/ScoreBar'
import { api } from '../lib/api'
import { deadlineDistance, formatDeadline } from '../lib/format'
import { evaluateOpportunity, verdictLabel } from '../lib/scoring'
import { useAppState } from '../state/AppState'

export function OpportunityPage() {
  const { opportunityId } = useParams()
  const { data, recordFeedback, saveStrategy } = useAppState()
  const opportunity = data.opportunities.find((item) => item.id === opportunityId)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const evaluation = useMemo(
    () => opportunity ? evaluateOpportunity(data.profile, opportunity, data.feedback) : null,
    [data.profile, data.feedback, opportunity],
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
  const hasPublicSource = /^https?:\/\//i.test(opportunity.sourceUrl)
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

      <header className="dossier-header">
        <div>
          <div className="dossier-topline">
            <span className={opportunity.fixture ? 'data-label demo' : 'data-label live'}>
              {opportunity.fixture ? 'Curated demo data' : 'GPT-5.6 normalized'}
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
        <div><CheckCircle2 size={17} /><span><small>Confidence</small><strong>{evaluation.confidence}/100</strong></span></div>
        {hasPublicSource ? (
          <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} /><span><small>Primary source</small><strong>Open evidence</strong></span>
          </a>
        ) : (
          <div><ExternalLink size={17} /><span><small>Primary source</small><strong>Pasted evidence</strong></span></div>
        )}
      </section>

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
            <ScoreBar label="Personal fit" value={evaluation.fit} tone="acid" />
            <ScoreBar label="Win signal" value={evaluation.winSignal} />
            <ScoreBar label="Hiddenness" value={evaluation.hiddenness} tone="warm" />
            <ScoreBar label="Strategic value" value={evaluation.strategicValue} />
            <ScoreBar label="Effort fit" value={evaluation.effortFit} />
            <ScoreBar label="Risk" value={evaluation.risk} tone="warm" />
          </section>
          <section className="requirements-card">
            <p className="section-kicker">Participation cost</p>
            <strong>{opportunity.effortHours} estimated hours</strong>
            <h3>Requirements</h3>
            <ul>{opportunity.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3>Deliverables</h3>
            <ul>{opportunity.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="sidebar-actions">
            <button onClick={() => recordFeedback(opportunity, 'saved')}><Bookmark size={16} /> Save</button>
            <button onClick={() => recordFeedback(opportunity, 'more-like-this')}><MoreHorizontal size={16} /> More like this</button>
            {hasPublicSource ? (
              <a href={opportunity.sourceUrl} target="_blank" rel="noreferrer">Verify source <ArrowUpRight size={16} /></a>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  )
}
