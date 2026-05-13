const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== TESTING DIRECT REQUEST ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(5000);
  
  // Try to make a direct request via the rift client
  const result = await page.evaluate(async () => {
    // Access the rift client through the window
    // We need to find it in React internals
    const results = {
      foundStore: false,
      requestResult: null,
      error: null,
    };
    
    try {
      // Try to access any global stores
      for (const key of Object.keys(window)) {
        const val = window[key];
        if (val && typeof val === 'object' && val.send) {
          results.foundStore = true;
          
          // Try to send a request
          const requestPayload = JSON.stringify([7, 999, '/lol-summoner/v1/summoners/202225048', 'GET']);
          await val.send(requestPayload);
          results.requestResult = 'sent';
          break;
        }
      }
    } catch (e) {
      results.error = String(e);
    }
    
    return results;
  });
  
  console.log('Direct request result:', result);
  
  await page.waitForTimeout(10000);
  
  // Check if response arrived
  const hasResponse = await page.evaluate(() => {
    return document.body.innerText.includes('"gameName":"JosueGalRe"');
  });
  
  console.log('Has response in DOM:', hasResponse);
  
  await page.screenshot({ path: '/tmp/shoma-test-request.png', fullPage: true });
  await browser.close();
})();
