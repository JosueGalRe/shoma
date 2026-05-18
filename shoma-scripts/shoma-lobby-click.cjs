const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false,
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  page.on('console', (msg) => console.log(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => console.log(`[ERROR] ${err.message}`))

  console.log('Connecting...')
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)

  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(8000)

  await page.screenshot({ path: '/tmp/shoma-click-1.png', fullPage: true })

  console.log('Attempting to click dashboard link...')

  // Try multiple selectors
  const selectors = [
    'a:has-text("Open connected dashboard")',
    'button:has-text("Open connected dashboard")',
    'a:has-text("OPEN CONNECTED DASHBOARD")',
    'button:has-text("OPEN CONNECTED DASHBOARD")',
    '[role="link"]:has-text("dashboard")',
    'text=Open connected dashboard',
    'text=OPEN CONNECTED DASHBOARD',
  ]

  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first()
      const count = await el.count()
      if (count > 0) {
        const visible = await el.isVisible()
        console.log(`Found element with "${selector}": visible=${visible}`)
        if (visible) {
          await el.click()
          console.log('Clicked!')
          break
        }
      }
    } catch (e) {
      console.log(`Selector "${selector}" failed: ${e.message}`)
    }
  }

  await page.waitForTimeout(3000)
  console.log('URL after click:', page.url())
  await page.screenshot({ path: '/tmp/shoma-click-2.png', fullPage: true })

  // Get all links and buttons on page
  console.log('\n--- All links ---')
  const links = await page.locator('a').all()
  for (const link of links) {
    const text = await link.textContent()
    const href = await link.getAttribute('href')
    console.log(`Link: text="${text?.trim()}", href="${href}"`)
  }

  console.log('\n--- All buttons ---')
  const buttons = await page.locator('button').all()
  for (const button of buttons) {
    const text = await button.textContent()
    console.log(`Button: text="${text?.trim()}"`)
  }

  await browser.close()
})()
