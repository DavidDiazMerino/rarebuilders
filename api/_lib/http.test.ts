import { describe, expect, it } from 'vitest'
import { publicMessage } from './http'

describe('public API errors', () => {
  it('does not expose provider quota details to product users', () => {
    const error = new Error('429 You exceeded your current quota, check billing details.')

    expect(publicMessage(error)).toBe(
      'The shared live GPT budget is currently unavailable. The cached demo remains fully testable.',
    )
  })
})
