const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false,
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  page.on('console', (msg) => console.log(`[${msg.type()}] ${msg.text()}`))

  console.log('=== MONITORING STATE ===')
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)

  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(12000)

  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first()
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click()
  }

  // Monitor for 30 seconds, checking state every 5 seconds
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(5000)

    const state = await page.evaluate(() => {
      // Try to find React component state by looking at DOM
      const memberCards = Array.from(document.querySelectorAll('div')).filter((el) => {
        const text = el.textContent || ''
        return text.includes('MIDDLE / FILL') || text.includes('Unknown summoner')
      })

      return {
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 1500),
        hasJosueGalRe: document.body.innerText.includes('JosueGalRe'),
        hasUnknown: document.body.innerText.includes('Unknown summoner'),
        memberCardsFound: memberCards.length,
      }
    })

    console.log(`\n--- State at ${(i + 1) * 5}s ---`)
    console.log('Has JosueGalRe:', state.hasJosueGalRe)
    console.log('Has Unknown:', state.hasUnknown)
    console.log('Member cards:', state.memberCardsFound)

    if (state.hasJosueGalRe && !state.hasUnknown) {
      console.log('\n✅ SUCCESS! Name appeared after', (i + 1) * 5, 'seconds')
      break
    }
  }

  await page.screenshot({ path: '/tmp/shoma-monitor-final.png', fullPage: true })
  await browser.close()
})()
