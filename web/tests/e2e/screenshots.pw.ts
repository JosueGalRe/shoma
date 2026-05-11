import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const routes = [
  { path: '/', name: 'home' },
  { path: '/connected/lobby', name: 'connected-lobby' },
  { path: '/connected/champ-select', name: 'connected-champ-select' },
  { path: '/connected/invites', name: 'connected-invites' },
] as const

const screenshotDir = join(process.cwd(), 'test-results', 'screenshots')

test.beforeAll(() => {
  mkdirSync(screenshotDir, { recursive: true })
})

for (const route of routes) {
  test(`screenshots ${route.path}`, async ({ page }, testInfo) => {
    await page.goto(route.path)

    await expect(page).toHaveURL(route.path)
    await page.screenshot({
      path: join(screenshotDir, `${testInfo.project.name.toLowerCase()}-${route.name}.png`),
      fullPage: true,
    })
  })
}
