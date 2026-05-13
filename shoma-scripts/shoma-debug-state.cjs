const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== DEBUGGING STATE ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);
  
  // Check if page has the new code by evaluating a test
  const codeCheck = await page.evaluate(() => {
    // Try to access the module (won't work due to bundling, but let's check)
    return 'Page loaded';
  });
  console.log('Code check:', codeCheck);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(10000);
  
  // Get the exact text content
  const bodyText = await page.innerText('body');
  console.log('\n--- Full body text ---');
  console.log(bodyText);
  
  // Check for "Unknown summoner" occurrences
  const unknownMatches = (bodyText.match(/Unknown summoner/g) || []).length;
  console.log(`\n"Unknown summoner" occurrences: ${unknownMatches}`);
  
  // Check for "JosueGalRe" occurrences  
  const josueMatches = (bodyText.match(/JosueGalRe/g) || []).length;
  console.log(`"JosueGalRe" occurrences: ${josueMatches}`);
  
  // Look for log messages about member load
  const hasTimeout = bodyText.includes('Request timeout');
  const hasLoadFailed = bodyText.includes('lobby member load failed');
  console.log(`Has timeout in logs: ${hasTimeout}`);
  console.log(`Has load failed in logs: ${hasLoadFailed}`);
  
  await page.screenshot({ path: '/tmp/shoma-debug-state.png', fullPage: true });
  
  await browser.close();
})();
