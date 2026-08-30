import { Check, ExternalLink, X } from 'lucide-react'
import type { ProfileMemoryItem, ProfileMemoryReviewStatus } from '../../shared/domain'

type ReviewDecision = Extract<ProfileMemoryReviewStatus, 'approved' | 'rejected'>

type ProfileMemoryLedgerProps = {
  items: ProfileMemoryItem[]
  onReview: (itemId: string, decision: ReviewDecision) => void
}

const sections: Array<{
  status: ProfileMemoryReviewStatus
  title: string
  empty: string
}> = [
  {
    status: 'pending',
    title: 'Pending review',
    empty: 'No inferred memories are waiting for your decision.',
  },
  {
    status: 'approved',
    title: 'Approved memory',
    empty: 'Nothing has been explicitly approved yet.',
  },
  {
    status: 'rejected',
    title: 'Rejected memory',
    empty: 'Rejected signals stay here so the system does not propose them again.',
  },
]

export function ProfileMemoryLedger({ items, onReview }: ProfileMemoryLedgerProps) {
  return (
    <section className="profile-memory-ledger" aria-labelledby="profile-memory-ledger-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Audited builder memory</p>
          <h2 id="profile-memory-ledger-title">What is known, inferred and rejected.</h2>
        </div>
        <span>{items.filter((item) => item.reviewStatus === 'pending').length} pending</span>
      </div>
      <p className="muted-copy">
        Imported or inferred signals remain candidates until you approve them. Rejections are retained as negative evidence.
      </p>

      <div className="profile-memory-sections">
        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.reviewStatus === section.status)
          return (
            <section className={`profile-memory-section ${section.status}`} key={section.status}>
              <div className="profile-memory-section-heading">
                <h3>{section.title}</h3>
                <span>{sectionItems.length}</span>
              </div>
              {sectionItems.length ? sectionItems.map((item) => (
                <article className="profile-memory-item" key={item.id}>
                  <div className="profile-memory-item-heading">
                    <span>{item.kind}</span>
                    <strong>{item.title}</strong>
                  </div>
                  {item.detail ? <p>{item.detail}</p> : null}
                  <div className="profile-memory-source">
                    <span>{item.source.label}</span>
                    {item.source.reference?.startsWith('http') ? (
                      <a href={item.source.reference} target="_blank" rel="noreferrer">
                        Source <ExternalLink size={12} />
                      </a>
                    ) : item.source.reference ? <small>{item.source.reference}</small> : null}
                  </div>
                  {item.evidence.length ? (
                    <details>
                      <summary>{item.evidence.length} evidence item{item.evidence.length === 1 ? '' : 's'}</summary>
                      <ul>{item.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>
                    </details>
                  ) : null}
                  {item.reviewNote ? <blockquote>{item.reviewNote}</blockquote> : null}
                  {item.reviewStatus === 'pending' ? (
                    <div className="profile-memory-actions">
                      <button
                        className="button secondary"
                        aria-label={`Reject ${item.title}`}
                        onClick={() => onReview(item.id, 'rejected')}
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        className="button primary"
                        aria-label={`Approve ${item.title}`}
                        onClick={() => onReview(item.id, 'approved')}
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  ) : null}
                </article>
              )) : <p className="profile-memory-empty">{section.empty}</p>}
            </section>
          )
        })}
      </div>
    </section>
  )
}
