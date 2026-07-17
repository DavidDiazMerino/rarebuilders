export function formatDeadline(value: string | null) {
  if (!value) return 'Deadline unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function deadlineDistance(value: string | null) {
  if (!value) return 'Needs verification'
  const difference = new Date(value).getTime() - Date.now()
  const days = Math.ceil(difference / 86_400_000)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

export function sourceKindLabel(kind: string) {
  return kind === 'demo' ? 'Curated demo data' : kind.replace('-', ' ')
}
