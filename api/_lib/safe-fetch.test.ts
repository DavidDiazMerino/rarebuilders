import { describe, expect, it } from 'vitest'
import { fetchPublicSource } from './safe-fetch'

describe('safe source fetching', () => {
  it.each([
    'http://127.0.0.1:3000/secret',
    'http://10.0.0.1/internal',
    'http://169.254.169.254/latest/meta-data',
    'file:///etc/passwd',
    'https://user:password@example.com',
  ])('rejects unsafe source %s', async (source) => {
    await expect(fetchPublicSource(source)).rejects.toThrow()
  })
})
