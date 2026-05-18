const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false,
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  page.on('console', (msg) => console.log(`[${msg.type()}] ${msg.text()}`))

  console.log('=== FINAL TEST v4 ===')
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)

  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(12000)

  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first()
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click()
  }

  // Wait longer for the new async loading
  await page.waitForTimeout(20000)

  const text = await page.innerText('body')
  const hasJosueGalRe = text.includes('JosueGalRe')
  const hasUnknown = text.includes('Unknown summoner')
  const hasTimeout = text.includes('Request timeout')

  console.log('\n=== RESULTS ===')
  console.log('Has JosueGalRe:', hasJosueGalRe)
  console.log('Has Unknown summoner:', hasUnknown)
  console.log('Has timeout in logs:', hasTimeout)

  // Check for profile icon
  const images = await page.locator('img').all()
  let hasProfileIcon = false
  for (const img of images) {
    const src = await img.getAttribute('src')
    if (src?.includes('profileicon')) {
      hasProfileIcon = true
      console.log('Profile icon:', src)
      break
    }
  }

  await page.screenshot({ path: '/tmp/shoma-final-test-4.png', fullPage: true })

  await browser.close()

  if (hasJosueGalRe && !hasUnknown) {
    console.log('\n🎉 SUCCESS! Summoner name displayed correctly!')
    process.exit(0)
  } else {
    console.log('\n⚠️ Still showing Unknown summoner')
    process.exit(1)
  }
})()
