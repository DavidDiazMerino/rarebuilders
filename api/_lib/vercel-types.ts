import type { IncomingHttpHeaders } from 'node:http'

export type VercelRequest = {
  method?: string
  headers: IncomingHttpHeaders
  body: unknown
  query: Record<string, string | string[] | undefined>
}

export type VercelResponse = {
  status: (statusCode: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string | number | readonly string[]) => VercelResponse
}
