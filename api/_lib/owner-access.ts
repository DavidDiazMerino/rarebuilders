import { createHash, timingSafeEqual } from 'node:crypto'
import type { VercelRequest } from './vercel-types.js'

export function isOwnerRequest(req: VercelRequest) {
  const expected = process.env.OWNER_ACCESS_CODE_SHA256?.trim().toLowerCase()
  const header = req.headers['x-rarebuilders-owner-code']
  const code = Array.isArray(header) ? header[0] : header
  if (!expected || !code || !/^[a-f0-9]{64}$/.test(expected)) return false
  const actual = createHash('sha256').update(code).digest('hex')
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'))
}
