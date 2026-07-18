import { describe, expect, it } from 'vitest'
import { extractHtmlSource, fetchPublicSource } from './safe-fetch'

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

  it('prefers structured opportunity content over navigation and preserves lists', () => {
    const result = extractHtmlSource(`
      <html>
        <head>
          <title>Useful AI Challenge</title>
          <meta name="description" content="Build an evidence-backed AI tool.">
        </head>
        <body>
          <nav>${'<a>Unrelated navigation</a>'.repeat(100)}</nav>
          <main>
            <h1>Useful AI Challenge</h1>
            <p>Applications are open for practical developer tools.</p>
            <h2>Requirements</h2>
            <ul>
              <li>Submit a working prototype</li>
              <li>Include a public repository</li>
            </ul>
            <h2>Deadline</h2>
            <p>August 20, 2026 at 17:00 UTC.</p>
            <h2>Prize</h2>
            <p>$5,000 and a demo day invitation.</p>
          </main>
          <footer>${'Cookie settings '.repeat(100)}</footer>
        </body>
      </html>
    `, 'https://example.com/useful-ai-challenge')

    expect(result.title).toBe('Useful AI Challenge')
    expect(result.text).toContain('## Requirements')
    expect(result.text).toContain('- Submit a working prototype')
    expect(result.text).toContain('August 20, 2026 at 17:00 UTC.')
    expect(result.text).not.toContain('Unrelated navigation')
    expect(result.wordCount).toBeGreaterThan(20)
  })

  it('adds JSON-LD dates and organizer when they are not visible in the article', () => {
    const result = extractHtmlSource(`
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@type": "Event",
              "name": "Open Data Prize",
              "description": "A civic data competition.",
              "endDate": "2026-09-01T17:00:00+02:00",
              "organizer": { "name": "Madrid Data Lab" }
            }
          </script>
        </head>
        <body>
          <main>
            <h1>Open Data Prize</h1>
            <p>Teams build a public prototype and submit the source code.</p>
            <p>Applications include a short impact explanation and a demo.</p>
          </main>
        </body>
      </html>
    `, 'https://example.com/open-data-prize')

    expect(result.text).toContain('End date: 2026-09-01T17:00:00+02:00')
    expect(result.text).toContain('Organizer: Madrid Data Lab')
    expect(result.text).toContain('## Main source content')
  })
})
