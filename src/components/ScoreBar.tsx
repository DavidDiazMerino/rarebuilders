export function ScoreBar({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: number
  tone?: 'ink' | 'acid' | 'warm'
}) {
  return (
    <div className="score-bar">
      <div className="score-bar-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="score-bar-track" aria-label={`${label}: ${value} out of 100`}>
        <span className={`score-bar-fill ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
