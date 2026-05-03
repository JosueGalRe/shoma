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
  
  console.log('=== TESTING FIX ===');
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
  
  const text = await page.innerText('body');
  const hasJosueGalRe = text.includes('JosueGalRe');
  const hasUnknown = text.includes('Unknown summoner');
  
  console.log('\n=== RESULTS ===');
  console.log('Has JosueGalRe:', hasJosueGalRe);
  console.log('Has Unknown summoner:', hasUnknown);
  
  // Get member name from the lobby card
  const memberName = await page.evaluate(() => {
    const memberElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent?.includes('MIDDLE / FILL')
    );
    if (memberElements.length > 0) {
      const parent = memberElements[0].closest('div[class*="group"]') || memberElements[0].parentElement;
      return parent?.textContent?.substring(0, 200);
    }
    return null;
  });
  
  console.log('Member card text:', memberName);
  
  await page.screenshot({ path: '/tmp/mimic-test-fix.png', fullPage: true });
  
  // Check for profile icon image
  const images = await page.locator('img').all();
  console.log('\nImages:');
  for (const img of images) {
    const src = await img.getAttribute('src');
    const alt = await img.getAttribute('alt');
    if (src?.includes('profileicon') || alt?.includes('Josue')) {
      console.log(`  Profile icon: ${src}`);
    }
  }
  
  await browser.close();
  
  if (hasJosueGalRe && !hasUnknown) {
    console.log('\n✅ FIX SUCCESSFUL: JosueGalRe is now displayed!');
  } else {
    console.log('\n❌ FIX INCOMPLETE: Still showing Unknown summoner or JosueGalRe not found');
  }
})();
