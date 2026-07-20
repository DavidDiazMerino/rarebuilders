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

export function formatDeadlineMoment(value: string | null, timeZone?: string) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return `${part('month')} ${part('day')} · ${part('hour')}:${part('minute')}`
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
  return kind === 'demo' ? 'Illustrative pattern' : kind.replace('-', ' ')
}
