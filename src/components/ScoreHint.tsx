import { CircleHelp } from 'lucide-react'

export function ScoreHint({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <span className="score-hint" tabIndex={0} aria-label={`${label}. ${description}`}>
      <span>{label}</span>
      <CircleHelp size={12} aria-hidden="true" />
      <span className="score-hint-popover" role="tooltip">{description}</span>
    </span>
  )
}
