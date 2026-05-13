const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(10000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(5000);
  
  console.log('\n=== EXTRACTING LOBBY MEMBER DATA ===');
  
  // Try to access React internal state
  const reactState = await page.evaluate(() => {
    // Find React fiber roots
    const results = {
      fiberRoots: [],
      riftStore: null,
    };
    
    // Try to find any exposed stores or state
    for (const key of Object.keys(window)) {
      if (key.toLowerCase().includes('store') || key.toLowerCase().includes('rift')) {
        try {
          const val = window[key];
          if (val && typeof val === 'object') {
            results[key] = typeof val.getState === 'function' ? 'has getState' : 'object';
          }
        } catch (e) {}
      }
    }
    
    return results;
  });
  
  console.log('Window state:', JSON.stringify(reactState, null, 2));
  
  // Extract all visible text in the lobby area
  const lobbyText = await page.evaluate(() => {
    // Look for the relay preview section which has raw data
    const relayPreview = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent?.includes('receive: [8,')
    );
    
    if (relayPreview) {
      return {
        relayText: relayPreview.textContent?.substring(0, 3000),
        hasSummonerName: relayPreview.textContent?.includes('JosueGalRe'),
        hasSummonerId: relayPreview.textContent?.includes('summonerId'),
      };
    }
    return null;
  });
  
  console.log('\nRelay Preview Data:', JSON.stringify(lobbyText, null, 2));
  
  // Look for any text containing "JosueGalRe"
  const josueElements = await page.locator('text=JosueGalRe').all();
  console.log(`\nFound ${josueElements.length} elements with 'JosueGalRe'`);
  
  for (const el of josueElements) {
    const tag = await el.evaluate(e => e.tagName);
    const text = await el.textContent();
    console.log(`  Element: ${tag}, Text: ${text?.substring(0, 200)}`);
  }
  
  await page.screenshot({ path: '/tmp/shoma-debug-deep.png', fullPage: true });
  
  await browser.close();
})();
