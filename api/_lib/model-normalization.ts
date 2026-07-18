export function normalizeHundredScore(value: number) {
  const scaled = value > 0 && value <= 1 ? value * 100 : value
  return Math.round(Math.min(100, Math.max(0, scaled)))
}
