import { describe, expect, it } from 'vitest'
import { clientIp, PublicError, publicMessage } from './http'

describe('public API errors', () => {
  it('does not expose provider quota details to product users', () => {
    const error = new Error('429 You exceeded your current quota, check billing details.')

    expect(publicMessage(error)).toBe(
      'The shared live GPT budget is currently unavailable. The cached demo remains fully testable.',
    )
  })

  it('only exposes errors explicitly marked as safe', () => {
    expect(publicMessage(new PublicError('The source is too large.'))).toBe('The source is too large.')
    expect(publicMessage(new Error('redis.internal.example:6379 refused secret-token'))).toBe(
      'The server could not complete the request.',
    )
  })

  it('normalizes forwarded addresses before using them for safeguards', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '203.0.113.8, 10.0.0.1' } } as never)).toBe('203.0.113.8')
    expect(clientIp({ headers: { 'x-forwarded-for': 'spoofed-client' } } as never)).toBe('unknown')
  })
})
