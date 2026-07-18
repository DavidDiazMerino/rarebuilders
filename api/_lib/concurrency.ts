export async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  operation: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length)
  let cursor = 0

  const worker = async () => {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      results[index] = await operation(values[index], index)
    }
  }

  const workerCount = Math.min(values.length, Math.max(1, Math.floor(limit)))
  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}
