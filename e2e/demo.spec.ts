import { expect, test } from '@playwright/test'
import { initialAppData, STORAGE_KEY } from '../src/lib/storage'

test('judge can reach a scored opportunity and its strategy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /open david’s workspace/i }).click()

  await expect(page.getByRole('heading', { name: /five patterns shaping your opportunity model/i })).toBeVisible()
  await expect(page.getByText(/showing five decision patterns/i)).toBeVisible()
  await expect(page.getByText(/david’s workspace/i)).toBeVisible()
  const cachedDemoCard = page.locator('.opportunity-card').filter({
    hasText: 'Teacher workflow agent pilot',
  })
  await cachedDemoCard.getByRole('link', { name: /open dossier/i }).click()

  await expect(page.getByRole('heading', { name: /why this could work/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /why you may walk away/i })).toBeVisible()
  await expect(page.getByText(/cached reference strategy/i)).toBeVisible()
})

test('a new builder completes onboarding and reaches a personal radar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create another workspace/i }).click()

  await expect(page.getByText(/decision 01 of 06/i)).toBeVisible()
  await page.getByRole('button', { name: /set constraints/i }).click()
  await expect(page.getByText(/02 · hours available/i)).toBeVisible()
  await page.getByRole('button', { name: /build my radar/i }).click()

  await expect(page.getByRole('heading', { name: /five patterns shaping your opportunity model/i })).toBeVisible()
})

test('an imported GitHub repository remains visible in builder memory', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  data.profile.connectedGithubRepositories = [{
    fullName: 'example/rarebuilders',
    url: 'https://github.com/example/rarebuilders',
    description: 'Personal opportunity intelligence for builders.',
    language: 'TypeScript',
    importedAt: '2026-07-17T12:00:00.000Z',
  }]

  await page.goto('/')
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(data) },
  )
  await page.goto('/profile')

  await expect(page.getByText('In builder memory')).toBeVisible()
  await expect(page.getByRole('link', { name: /example\/rarebuilders/i })).toBeVisible()
  await expect(page.getByPlaceholder('GitHub username')).toHaveValue('example')
})

test('decision library preserves saved and source states', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  data.feedback = [{
    id: 'saved-1',
    opportunityId: data.opportunities[0].id,
    kind: 'decision',
    action: 'saved',
    domains: data.opportunities[0].domains,
    createdAt: '2026-07-17T12:00:00.000Z',
  }]
  data.candidates = [{
    id: 'devpost-1',
    connector: 'devpost',
    externalId: '1',
    canonicalUrl: 'https://example.devpost.com/',
    title: 'Example builder challenge',
    organizer: 'Example',
    summary: 'A source retained in local history.',
    deadline: null,
    reward: '$1,000',
    region: 'global',
    language: 'English',
    tags: ['ai'],
    participationModes: ['individual'],
    discoveredAt: '2026-07-17T12:00:00.000Z',
    lastSeenAt: '2026-07-17T12:00:00.000Z',
    status: 'inspected',
  }]

  await page.goto('/')
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(data) },
  )
  await page.goto('/library')

  await expect(page.getByRole('heading', { name: data.opportunities[0].title })).toBeVisible()
  await page.getByRole('button', { name: 'Sources' }).click()
  await expect(page.getByRole('heading', { name: 'Example builder challenge' })).toBeVisible()
  await expect(page.getByText('inspected', { exact: true })).toBeVisible()
})

test('latest feedback visibly replaces learning and the radar decision', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /open david’s workspace/i }).click()

  const firstCard = page.locator('.opportunity-card').first()
  const title = await firstCard.getByRole('heading').innerText()
  await firstCard.getByRole('button', { name: /more like this/i }).click()
  await expect(firstCard.getByRole('button', { name: /more like this/i })).toHaveClass(/selected/)
  await expect(page.getByText(/preference learned/i)).toBeVisible()

  await page.getByRole('link', { name: 'Builder memory' }).click()
  await expect(page.getByText('Learned from feedback')).toBeVisible()
  await expect(page.locator('.learned-signals em').first()).toContainText('+5')

  await page.getByRole('link', { name: 'Radar' }).click()
  const updatedCard = page.locator('.opportunity-card').filter({ hasText: title })
  await updatedCard.getByRole('button', { name: /^pass$/i }).click()
  await expect(updatedCard).toHaveCount(0)
  await expect(page.getByRole('button', { name: /undo pass/i })).toBeVisible()

  await page.getByRole('link', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Passed' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('link', { name: 'Builder memory' }).click()
  await expect(page.locator('.learned-signals em').first()).toContainText('+5')
})

test('builder reviews a CV extraction before applying it', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  const today = new Date().toISOString()
  data.connectorState = {
    github: { status: 'ready', lastSuccessAt: today },
    devpost: { status: 'ready', lastSuccessAt: today },
    eu: { status: 'ready', lastSuccessAt: today },
    kaggle: { status: 'ready', lastSuccessAt: today },
  }

  await page.route('**/api/profile/cv', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          headline: 'Product-minded TypeScript builder',
          summary: 'Builds useful AI products.',
          skills: [{ name: 'TypeScript', evidence: ['Built React applications'], confidence: 95 }],
          experiences: [],
          achievements: ['Shipped multiple prototypes'],
          education: [],
        },
        meta: { cached: false, requestId: 'test' },
      }),
    })
  })
  await page.goto('/')
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(data) },
  )
  await page.goto('/profile')
  await page.locator('input[accept*=".pdf"]').setInputFiles({
    name: 'cv.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('TypeScript builder with evidence from shipped React applications.'),
  })
  await page.getByRole('button', { name: /extract professional profile/i }).click()

  await expect(page.locator('input[value="Product-minded TypeScript builder"]')).toBeVisible()
  await page.getByRole('button', { name: /apply professional profile/i }).click()
  await expect(page.getByText('Professional profile is in Builder Memory')).toBeVisible()
  await expect(page.getByText('Product-minded TypeScript builder')).toBeVisible()
})

test('golden path imports the UNESCO call as live evidence without sending the profile', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'personal'
  data.profile.onboardingComplete = true
  const {
    id: _id,
    candidateId: _candidateId,
    discoveredAt: _discoveredAt,
    verifiedAt: _verifiedAt,
    provenance: _provenance,
    ...analysis
  } = data.opportunities[0]
  const sourceUrl = 'https://www.unesco.org/creativity/en/international-fund-cultural-diversity'

  await page.route('**/api/source/fetch', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          url: sourceUrl,
          title: 'International Fund for Cultural Diversity',
          text: 'UNESCO International Fund for Cultural Diversity supports projects that strengthen cultural and creative sectors. Applicants must review eligibility, funding rules, required documents and the official deadline before applying.',
          method: 'semantic-html',
          contentType: 'text/html',
          wordCount: 29,
          warnings: [],
        },
        meta: { cached: false, requestId: 'fetch-test' },
      }),
    })
  })
  await page.route('**/api/opportunities/analyze', async (route) => {
    const request = route.request().postDataJSON()
    expect(request.profile).toBeUndefined()
    expect(request.sourceUrl).toBe(sourceUrl)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          ...analysis,
          title: 'International Fund for Cultural Diversity',
          organizer: 'UNESCO',
          sourceLabel: 'UNESCO official call',
          sourceUrl,
          deadline: null,
          timezone: null,
          unknowns: ['Official deadline must be verified.'],
          summary: 'Funding call for projects that strengthen cultural and creative sectors.',
        },
        meta: { cached: false, requestId: 'analysis-test' },
      }),
    })
  })

  await page.goto('/')
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(data) },
  )
  await page.goto('/inbox')
  await page.getByPlaceholder('https://…').fill(sourceUrl)
  await page.getByRole('button', { name: 'Fetch' }).click()
  await expect(page.getByRole('button', { name: /readable/i })).toHaveClass(/selected/)
  await expect(page.getByText(/UNESCO International Fund for Cultural Diversity supports projects/i)).toBeVisible()
  await page.getByRole('button', { name: /analyze opportunity/i }).click()
  await expect(page.getByRole('heading', { name: 'International Fund for Cultural Diversity' })).toBeVisible()
  await expect(page.locator('.normalized-preview')).toHaveCSS('color', 'rgb(25, 26, 23)')
  await expect(page.locator('.normalized-preview')).toHaveCSS('background-color', 'rgb(250, 248, 241)')
  await page.getByRole('button', { name: /add to opportunity pool/i }).click()
  await expect(page.getByText(/live evidence/i)).toBeVisible()
  await expect(page.getByText('UNESCO', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Today’s radar', exact: true }).click()
  await expect(page.getByText(/live radar active/i)).toBeVisible()
  await expect(page.getByText(/add 4 more live sources/i)).toBeVisible()
  await expect(page.locator('.opportunity-card')).toHaveCount(1)
})

test('twice-weekly feed adds a visible scan digest without exposing profile data', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  await page.route('**/api/sources?action=feed**', async (route) => {
    expect(route.request().method()).toBe('GET')
    expect(route.request().postData()).toBeNull()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          cursor: '2026-08-30T22:00:00.000Z',
          candidates: [],
          opportunities: [],
          digest: {
            id: 'digest-scan-1',
            generatedAt: '2026-08-30T22:00:00.000Z',
            cursor: '2026-08-30T22:00:00.000Z',
            newSignals: 12,
            promotedSignals: 4,
            analysesUsed: 4,
            sourceErrors: 1,
            scanRunId: 'scan-1',
          },
        },
        meta: { cached: false, requestId: 'feed-test' },
      }),
    })
  })
  await page.goto('/')
  await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(data) })
  await page.goto('/radar')
  await expect(page.getByText('Latest twice-weekly scan')).toBeVisible()
  await expect(page.getByText(/12 changed signals · 4 promoted · 4 GPT analyses/i)).toBeVisible()
})

test('operations shows source health and pack controls', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  await page.route('**/api/sources?action=feed**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { cursor: '', candidates: [], opportunities: [], digest: null }, meta: { cached: false, requestId: 'feed' } }) }))
  await page.route('**/api/sources?action=status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { owner: true, updatedAt: '2026-08-30T22:00:00.000Z', latestRun: null, sourceCount: 11, signalCount: 34, candidateCount: 8, pausedPackIds: [], monthlyAnalysisUsage: 9 }, meta: { cached: false, requestId: 'status' } }) }))
  await page.route('**/api/sources?action=capabilities', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { capabilities: [], packs: [{ id: 'sports-vision', label: 'Football, vision & sports analytics', description: 'Tracking and sports data challenges.', wildcard: false, sourceCount: 3 }] }, meta: { cached: false, requestId: 'capabilities' } }) }))
  await page.goto('/')
  await page.evaluate(({ key, value }) => window.localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(data) })
  await page.goto('/operations')
  await expect(page.getByText('Monitored sources')).toBeVisible()
  await expect(page.getByText('11', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Football, vision & sports analytics' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run scan' })).toBeEnabled()
})
