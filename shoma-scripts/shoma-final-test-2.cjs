const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== FINAL TEST ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(12000); // Wait for profiles to load with 15s timeout
  
  const text = await page.innerText('body');
  const hasJosueGalRe = text.includes('JosueGalRe');
  const hasUnknown = text.includes('Unknown summoner');
  
  console.log('\n=== RESULTS ===');
  console.log('Has JosueGalRe:', hasJosueGalRe);
  console.log('Has Unknown summoner:', hasUnknown);
  
  // Check for profile icon image
  const images = await page.locator('img').all();
  let hasProfileIcon = false;
  let profileIconSrc = '';
  for (const img of images) {
    const src = await img.getAttribute('src');
    if (src?.includes('profileicon')) {
      hasProfileIcon = true;
      profileIconSrc = src;
      break;
    }
  }
  console.log('Has profile icon:', hasProfileIcon);
  if (hasProfileIcon) console.log('Profile icon URL:', profileIconSrc);
  
  await page.screenshot({ path: '/tmp/shoma-final-test-2.png', fullPage: true });
  
  await browser.close();
  
  if (hasJosueGalRe && !hasUnknown && hasProfileIcon) {
    console.log('\n✅ ALL CHECKS PASSED!');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed');
    process.exit(1);
  }
})();
