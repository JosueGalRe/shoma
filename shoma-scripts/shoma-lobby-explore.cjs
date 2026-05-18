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
  })

  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR] ${err.message}`)
  })

  console.log('=== STEP 1: Navigate and connect ===')
  await page.goto('http://localhost:5173/')
  await page.waitForTimeout(2000)

  await page.locator('input[aria-label="Connection code"]').first().fill('263542')
  await page.locator('button[type="submit"]').first().click()

  // Wait for connected state (wait for the state change log)
  await page.waitForTimeout(8000)

  console.log('Taking screenshot after connection...')
  await page.screenshot({ path: '/tmp/shoma-lobby-1-connected.png', fullPage: true })

  console.log('=== STEP 2: Open dashboard ===')
  const dashboardButton = await page.locator('button:has-text("OPEN CONNECTED DASHBOARD")').first()
  if (await dashboardButton.isVisible().catch(() => false)) {
    await dashboardButton.click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: '/tmp/shoma-lobby-2-dashboard.png', fullPage: true })
    console.log('Dashboard opened! URL:', page.url())
  } else {
    console.log('Dashboard button not found. Current URL:', page.url())
    await page.screenshot({ path: '/tmp/shoma-lobby-2-no-dashboard.png', fullPage: true })
  }

  console.log('=== STEP 3: Explore content ===')
  const text = await page.innerText('body').catch(() => '')

  console.log('\n--- Page text (first 3000 chars) ---')
  console.log(text.substring(0, 3000))

  const checks = {
    JosueGalRe: text.includes('JosueGalRe'),
    Omnividiente: text.includes('Omnividiente'),
    Diamante: text.includes('Diamante'),
    Queue: text.includes('queue') || text.includes('Queue'),
    Lobby: text.includes('lobby') || text.includes('Lobby'),
    'Ready Check': text.includes('Ready') || text.includes('ready'),
    Champion: text.includes('Champion') || text.includes('champion'),
    Skin: text.includes('Skin') || text.includes('skin'),
    Rune: text.includes('Rune') || text.includes('rune'),
    Invite: text.includes('Invite') || text.includes('invite'),
    'Summoners Rift': text.includes('Summoners Rift') || text.includes('Rift'),
  }

  console.log('\n--- Content Analysis ---')
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${key}: ${value}`)
  })

  console.log('\n=== STEP 4: Count UI elements ===')
  const memberCount = await page.locator('[class*="member"]').count()
  const cardCount = await page.locator('[class*="card"]').count()
  const buttonCount = await page.locator('button').count()
  console.log('Member elements:', memberCount)
  console.log('Card elements:', cardCount)
  console.log('Button elements:', buttonCount)

  await page.screenshot({ path: '/tmp/shoma-lobby-3-final.png', fullPage: true })

  console.log('\n=== CONSOLE LOGS ===')
  consoleLogs.forEach((log) => console.log(`[${log.type}] ${log.text}`))

  await browser.close()
})()
