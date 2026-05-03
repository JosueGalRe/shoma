import { expect, test } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/')
  await expect(page.getByText('MIMIC')).toBeVisible()
})

test('connected lobby loads without console errors', async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })

  await page.goto('/connected/lobby')
  await expect(page).toHaveURL('/connected/lobby')
  await expect(page.getByRole('heading', { name: /dashboard unavailable/i })).toBeVisible()
  expect(consoleErrors).toEqual([])
})
