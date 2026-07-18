import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { isOwnerRequest } from './owner-access'
import type { VercelRequest } from './vercel-types'

const request = (code?: string): VercelRequest => ({
  method: 'GET',
  body: undefined,
  query: {},
  headers: code ? { 'x-rarebuilders-owner-code': code } : {},
})

afterEach(() => {
  delete process.env.OWNER_ACCESS_CODE_SHA256
})

describe('personal quota access', () => {
  it('accepts only the code matching the configured SHA-256 digest', () => {
    process.env.OWNER_ACCESS_CODE_SHA256 = createHash('sha256').update('private-code').digest('hex')

    expect(isOwnerRequest(request('private-code'))).toBe(true)
    expect(isOwnerRequest(request('wrong-code'))).toBe(false)
    expect(isOwnerRequest(request())).toBe(false)
  })
})
