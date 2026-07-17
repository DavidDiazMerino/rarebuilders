import { randomUUID } from 'node:crypto'
import type { ApiFailure, ApiSuccess } from '../../shared/domain'
import type { VercelRequest, VercelResponse } from './vercel-types'

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
  const forwarded = req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0]?.trim() || 'unknown'
}

export function publicMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'The server could not complete the request.'
}
