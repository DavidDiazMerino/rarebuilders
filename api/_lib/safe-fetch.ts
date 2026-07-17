import { lookup } from 'node:dns/promises'
import ipaddr from 'ipaddr.js'
import * as cheerio from 'cheerio'

const MAX_BYTES = 1_000_000
const MAX_REDIRECTS = 3
const ALLOWED_TYPES = ['text/html', 'text/plain', 'application/xhtml+xml', 'application/xml']

function assertPublicIp(address: string) {
  const parsed = ipaddr.parse(address)
  if (parsed.range() !== 'unicast') throw new Error('Private, local and reserved network addresses are not allowed.')
}

async function assertSafeUrl(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Enter a valid public URL.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only HTTP and HTTPS sources are supported.')
  if (url.username || url.password) throw new Error('URLs containing credentials are not allowed.')
  if (ipaddr.isValid(url.hostname)) {
    assertPublicIp(url.hostname)
  } else {
    const addresses = await lookup(url.hostname, { all: true })
    if (!addresses.length) throw new Error('The source hostname could not be resolved.')
    addresses.forEach(({ address }) => assertPublicIp(address))
  }
  return url
}

async function readLimitedText(response: Response) {
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BYTES) throw new Error('The source is larger than the 1 MB import limit.')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new Error('The source is larger than the 1 MB import limit.')
    }
    chunks.push(value)
  }
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder().decode(output)
}

export async function fetchPublicSource(input: string) {
  let current = await assertSafeUrl(input)
  let response: Response | null = null

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
      headers: {
        'User-Agent': 'RareBuilders/1.0 (+https://github.com/DavidDiazMerino/rarebuilders)',
        Accept: 'text/html,text/plain,application/xhtml+xml',
      },
    })
    if (![301, 302, 303, 307, 308].includes(response.status)) break
    const location = response.headers.get('location')
    if (!location) throw new Error('The source returned an invalid redirect.')
    current = await assertSafeUrl(new URL(location, current).toString())
  }

  if (!response?.ok) throw new Error(`The source returned ${response?.status ?? 'no response'}.`)
  const type = (response.headers.get('content-type') ?? '').toLowerCase()
  if (!ALLOWED_TYPES.some((allowed) => type.includes(allowed))) {
    throw new Error('Only HTML and plain-text sources can be imported.')
  }
  const raw = await readLimitedText(response)
  if (type.includes('text/plain')) {
    return { url: current.toString(), title: current.hostname, text: raw.slice(0, 30_000).trim() }
  }
  const $ = cheerio.load(raw)
  $('script, style, noscript, svg, nav, footer, form').remove()
  const title = $('title').first().text().trim() || $('h1').first().text().trim() || current.hostname
  const text = $('main, article').first().text() || $('body').text()
  const normalized = text.replace(/\s+/g, ' ').trim().slice(0, 30_000)
  if (normalized.length < 80) throw new Error('The page did not expose enough readable text. Paste the announcement instead.')
  return { url: current.toString(), title: title.slice(0, 200), text: normalized }
}
