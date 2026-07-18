import { randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import type { ApiFailure, ApiSuccess } from '../../shared/domain.js'
import type { VercelRequest, VercelResponse } from './vercel-types.js'

export class PublicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicError'
  }
}

export function requestId(req: VercelRequest) {
  const existing = req.headers['x-vercel-id']
  return typeof existing === 'string' ? existing : randomUUID()
}

export function sendData<T>(
  res: VercelResponse,
  data: T,
  meta: ApiSuccess<T>['meta'],
  status = 200,
) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(status).json({ data, meta } satisfies ApiSuccess<T>)
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
  id: string,
) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.status(status).json({
    error: { code, message, requestId: id },
  } satisfies ApiFailure)
}

export function requireMethod(
  req: VercelRequest,
  res: VercelResponse,
  method: 'GET' | 'POST',
  id: string,
) {
  if (req.method === method) return true
  res.setHeader('Allow', method)
  sendError(res, 405, 'method_not_allowed', `Use ${method} for this endpoint.`, id)
  return false
}

export function clientIp(req: VercelRequest) {
  const forwarded = req.headers['x-vercel-forwarded-for'] ?? req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const candidate = value?.split(',')[0]?.trim() ?? ''
  return candidate.length <= 64 && isIP(candidate) ? candidate : 'unknown'
}

export function publicMessage(error: unknown, fallback = 'The server could not complete the request.') {
  if (error instanceof Error && error.message) {
    const message = error.message
    if (message.includes('429') && message.toLowerCase().includes('quota')) {
      return 'The shared live GPT budget is currently unavailable. The cached demo remains fully testable.'
    }
    if (message.includes('401') || message.toLowerCase().includes('incorrect api key')) {
      return 'Live GPT authentication is temporarily unavailable. The cached demo remains fully testable.'
    }
    if (error instanceof PublicError) return message
  }
  return fallback
}
