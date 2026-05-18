const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false,
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  // Capture ALL console logs
  const logs = []
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`)
    console.log(`[${msg.type()}] ${msg.text()}`)
  })

  console.log('=== ADVANCED DEBUG ===')
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)

  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(12000)

  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first()
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click()
  }

  // Wait and check for specific log patterns
  await page.waitForTimeout(20000)

  console.log('\n=== ANALYZING LOGS ===')
  const hasLoadFailed = logs.some((l) => l.includes('lobby member load failed'))
  const hasTimeout = logs.some((l) => l.includes('Request timeout'))
  const hasProfileLoaded = logs.some((l) => l.includes('profile') || l.includes('Profile'))

  console.log('Has load failed:', hasLoadFailed)
  console.log('Has timeout:', hasTimeout)

  // Try to find React DevTools
  const reactInfo = await page.evaluate(() => {
    return {
      hasReactDevtools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
      fiberRoots: window.__REACT_DEVTOOLS_GLOBAL_HOOK__
        ? Array.from(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(1)).length
        : 0,
    }
  })
  console.log('React info:', reactInfo)

  await page.screenshot({ path: '/tmp/shoma-debug-advanced.png', fullPage: true })

  // Check what the actual member card shows
  const memberCard = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter((el) => {
      const text = el.textContent || ''
      return text.includes('MIDDLE / FILL') || text.includes('Unknown summoner')
    })

    if (cards.length > 0) {
      // Get the closest card/parent
      const card = cards[0].closest('div[class*="group"]') || cards[0]
      return {
        text: card.textContent?.substring(0, 300),
        html: card.innerHTML?.substring(0, 500),
      }
    }
    return null
  })

  console.log('\nMember card:', memberCard)

  await browser.close()
})()
