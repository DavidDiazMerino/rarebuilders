import { expect, test } from '@playwright/test'

test('judge can reach a scored opportunity and its strategy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /explore david’s radar/i }).click()

  await expect(page.getByRole('heading', { name: /five opportunities worth your attention/i })).toBeVisible()
  await page.getByRole('link', { name: /open dossier/i }).first().click()

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
