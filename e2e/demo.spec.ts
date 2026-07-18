import { expect, test } from '@playwright/test'
import { initialAppData, STORAGE_KEY } from '../src/lib/storage'

test('judge can reach a scored opportunity and its strategy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /explore david’s radar/i }).click()

  await expect(page.getByRole('heading', { name: /five opportunities worth your attention/i })).toBeVisible()
  const cachedDemoCard = page.locator('.opportunity-card').filter({
    hasText: 'Independent publishing discovery grant',
  })
  await cachedDemoCard.getByRole('link', { name: /open dossier/i }).click()

  await expect(page.getByRole('heading', { name: /why this could work/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /why you may walk away/i })).toBeVisible()
  await expect(page.getByText(/cached demo result/i)).toBeVisible()
})

test('a new builder completes onboarding and reaches a personal radar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /build my profile/i }).click()

  await expect(page.getByText(/decision 01 of 06/i)).toBeVisible()
  await page.getByRole('button', { name: /set constraints/i }).click()
  await expect(page.getByText(/02 · hours available/i)).toBeVisible()
  await page.getByRole('button', { name: /build my radar/i }).click()

  await expect(page.getByRole('heading', { name: /five opportunities worth your attention/i })).toBeVisible()
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
  await page.getByRole('button', { name: /explore david’s radar/i }).click()

  const firstCard = page.locator('.opportunity-card').first()
  const title = await firstCard.getByRole('heading').innerText()
  await firstCard.getByRole('button', { name: /more like this/i }).click()
  await expect(firstCard.getByRole('button', { name: /more like this/i })).toHaveClass(/selected/)

  await page.getByRole('link', { name: 'Builder memory' }).click()
  await expect(page.getByText('Learned from decisions')).toBeVisible()
  await expect(page.locator('.learned-signals em').first()).toContainText('+5')

  await page.getByRole('link', { name: 'Radar' }).click()
  const updatedCard = page.locator('.opportunity-card').filter({ hasText: title })
  await updatedCard.getByRole('button', { name: /not for me/i }).click()
  await expect(updatedCard).toHaveCount(0)

  await page.getByRole('link', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Rejected' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.getByRole('link', { name: 'Builder memory' }).click()
  await expect(page.locator('.learned-signals em').first()).toContainText('-5')
})

test('builder reviews a CV extraction before applying it', async ({ page }) => {
  const data = initialAppData()
  data.mode = 'demo'
  const today = new Date().toISOString()
  data.connectorRefresh = { github: today, devpost: today, eu: today, kaggle: today }

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
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'cv.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('TypeScript builder with evidence from shipped React applications.'),
  })
  await page.getByRole('button', { name: /extract professional profile/i }).click()

  await expect(page.locator('input[value="Product-minded TypeScript builder"]')).toBeVisible()
  await page.getByRole('button', { name: /apply professional profile/i }).click()
  await expect(page.getByText('Product-minded TypeScript builder')).toBeVisible()
})
