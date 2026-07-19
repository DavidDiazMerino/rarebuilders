import { ScoreHint } from './ScoreHint'

export function ScoreBar({
  label,
  value,
  tone = 'ink',
  description,
}: {
  label: string
  value: number
  tone?: 'ink' | 'acid' | 'warm'
  description?: string
}) {
  return (
    <div className="score-bar">
      <div className="score-bar-label">
        {description ? <ScoreHint label={label} description={description} /> : <span>{label}</span>}
        <strong>{value}</strong>
      </div>
      <div className="score-bar-track" aria-label={`${label}: ${value} out of 100`}>
        <span className={`score-bar-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
