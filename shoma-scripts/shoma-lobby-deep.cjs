const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false,
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  const consoleLogs = []
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() })
    console.log(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => console.log(`[PAGE ERROR] ${err.message}`))

  // Connect
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)
  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForTimeout(8000)

  // Navigate to lobby
  await page.locator('a:has-text("Open connected dashboard")').first().click()
  await page.waitForTimeout(3000)

  console.log('\n=== LOBBY PAGE ANALYSIS ===')
  console.log('URL:', page.url())

  const text = await page.innerText('body')
  console.log('\n--- Full page text ---')
  console.log(text.substring(0, 4000))

  // Check for images (profile icons, etc)
  const images = await page.locator('img').all()
  console.log(`\n--- Images found: ${images.length} ---`)
  for (const img of images.slice(0, 10)) {
    const src = await img.getAttribute('src')
    const alt = await img.getAttribute('alt')
    console.log(`IMG: src="${src?.substring(0, 100)}", alt="${alt}"`)
  }

  // Take screenshots of different sections
  await page.screenshot({ path: '/tmp/shoma-lobby-full.png', fullPage: true })

  // Try to find summoner profile
  const hasSummoner = text.includes('JosueGalRe')
  const hasOmnividiente = text.includes('Omnividiente')
  const hasDiamante = text.includes('Diamante')
  const hasSinClasificar = text.includes('Sin clasificar')
  const hasProfileIcon = images.some(async (img) => {
    const src = await img.getAttribute('src')
    return src && src.includes('profileicon')
  })

  console.log('\n--- Profile Data Check ---')
  console.log('Has JosueGalRe:', hasSummoner)
  console.log('Has Omnividiente:', hasOmnividiente)
  console.log('Has Diamante:', hasDiamante)
  console.log('Has Sin clasificar:', hasSinClasificar)

  // Explore navigation
  console.log('\n=== EXPLORING NAVIGATION ===')

  // Click Invites
  console.log('Clicking Invites...')
  await page.locator('a:has-text("Invites")').first().click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/shoma-invites.png', fullPage: true })
  console.log('Invites URL:', page.url())

  // Click Champ Select
  console.log('Clicking Champ Select...')
  await page.locator('a:has-text("Champ Select")').first().click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/shoma-champselect.png', fullPage: true })
  console.log('Champ Select URL:', page.url())

  // Go back to Lobby
  console.log('Going back to Lobby...')
  await page.locator('a:has-text("Lobby")').first().click()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: '/tmp/shoma-lobby-return.png', fullPage: true })

  console.log('\n=== CONSOLE LOGS SUMMARY ===')
  const errors = consoleLogs.filter((log) => log.type === 'error')
  const warnings = consoleLogs.filter((log) => log.type === 'warning')
  console.log(`Total logs: ${consoleLogs.length}, Errors: ${errors.length}, Warnings: ${warnings.length}`)

  await browser.close()
})()
