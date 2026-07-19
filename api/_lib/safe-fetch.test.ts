import { describe, expect, it } from 'vitest'
import {
  extractHtmlSource,
  enrichDevpostSource,
  fetchPublicSource,
  matchDevpostChallenge,
  matchKaggleCompetition,
} from './safe-fetch'

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

  it('renders HTML-encoded JSON-LD descriptions as readable text', () => {
    const result = extractHtmlSource(`
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@type": "Event",
              "name": "Encoded challenge",
              "description": "&lt;h2&gt;How to enter&lt;/h2&gt;&lt;p&gt;Build a working prototype.&lt;/p&gt;"
            }
          </script>
        </head>
        <body><main><p>Submit a repository and demo before the deadline.</p></main></body>
      </html>
    `, 'https://example.com/encoded')

    expect(result.text).toContain('## How to enter')
    expect(result.text).toContain('Build a working prototype.')
    expect(result.text).not.toContain('&lt;h2')
  })

  it('preserves Devpost eligibility, supported countries and participant count', () => {
    const result = extractHtmlSource(`
      <html><head><title>Builder challenge</title></head><body>
        <ul id="eligibility-list">
          <li>Above legal age of majority</li>
          <li>Only specific countries included</li>
        </ul>
        <ul id="eligibility-countries-modal-list">
          <li>Spain</li><li>Portugal</li>
        </ul>
        <a href="/participants">Participants (42831)</a>
        <main><h1>Builder challenge</h1><p>Build and submit a working tool before the deadline.</p></main>
      </body></html>
    `, 'https://builder-challenge.devpost.com/')

    expect(result.text).toContain('Eligibility: Above legal age of majority · Only specific countries included')
    expect(result.text).toContain('Eligible countries and territories (2): Spain, Portugal')
    expect(result.text).toContain('Visible participants: (42831)')
  })

  it('does not substitute a different Devpost challenge when the requested host is absent', () => {
    const candidates = [{
      id: 1,
      title: 'Another challenge',
      url: 'https://another-challenge.devpost.com/',
    }]

    expect(matchDevpostChallenge(
      new URL('https://requested-challenge.devpost.com/'),
      candidates,
    )).toBeUndefined()
  })

  it('enriches sparse Devpost metadata with the full public challenge page', () => {
    const metadata = {
      url: 'https://openai.devpost.com/',
      title: 'OpenAI Build Week',
      text: 'Title: OpenAI Build Week\nDeadline: July 21\nPrize: $100,000',
      method: 'devpost-api' as const,
      contentType: 'application/json',
      wordCount: 9,
      warnings: ['Verify the rules.'],
    }
    const publicPage = extractHtmlSource(`
      <html><head><title>OpenAI Build Week</title></head><body>
        <main>
          <h1>OpenAI Build Week</h1>
          <h2>Requirements</h2>
          <p>Create a working project using Codex with GPT-5.6.</p>
          <ul>
            <li>Upload a public demo video under three minutes.</li>
            <li>Provide a repository and a Codex Session ID.</li>
          </ul>
          <h2>Who can participate</h2>
          <p>Adults in supported countries may participate online.</p>
        </main>
      </body></html>
    `, metadata.url)

    const result = enrichDevpostSource(metadata, publicPage)

    expect(result.method).toBe('devpost-api')
    expect(result.text).toContain('$100,000')
    expect(result.text).toContain('Codex Session ID')
    expect(result.text).toContain('## Requirements')
    expect(result.wordCount).toBeGreaterThan(metadata.wordCount)
  })

  it('does not substitute a different Kaggle competition when the requested ref is absent', () => {
    expect(matchKaggleCompetition('requested-competition', [{
      ref: 'another-competition',
      title: 'Another competition',
    }])).toBeUndefined()
  })
})
