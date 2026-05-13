const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[ERROR] ${err.message}`));
  
  console.log('=== CONNECTING ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  
  // Wait for connection
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Connected') || document.body.innerText.includes('CONNECTED');
  }, { timeout: 15000 });
  
  console.log('Connected!');
  await page.waitForTimeout(3000);
  
  // Navigate to dashboard
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(5000); // Wait for lobby data to load
  
  console.log('\n=== EXTRACTING APP STATE ===');
  
  // Extract React state from the page
  const appState = await page.evaluate(() => {
    // Try to find the Rift store state
    const results = {
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 2000),
      hasUnknownSummoner: document.body.innerText.includes('Unknown summoner'),
      hasJosueGalRe: document.body.innerText.includes('JosueGalRe'),
    };
    
    // Try to access window stores if exposed
    const win = window;
    if (win.__RIFT_STORE__) {
      results.riftStore = win.__RIFT_STORE__;
    }
    
    return results;
  });
  
  console.log('App State:', JSON.stringify(appState, null, 2));
  
  // Look for specific elements
  console.log('\n=== CHECKING LOBBY MEMBER ELEMENTS ===');
  const memberCards = await page.locator('div').filter({ hasText: /Unknown summoner/ }).all();
  console.log(`Found ${memberCards.length} elements with 'Unknown summoner'`);
  
  // Get all images
  const images = await page.locator('img').all();
  console.log(`\nTotal images on page: ${images.length}`);
  for (const img of images.slice(0, 15)) {
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt');
    console.log(`  IMG: src="${src?.substring(0, 80)}", alt="${alt}"`);
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/shoma-debug-summoner.png', fullPage: true });
  
  // Check network requests for summoner API
  console.log('\n=== CHECKING NETWORK REQUESTS ===');
  // We can't access network logs directly, but let's check if there are any visible errors
  
  await browser.close();
  console.log('\n=== DEBUG COMPLETE ===');
})();
