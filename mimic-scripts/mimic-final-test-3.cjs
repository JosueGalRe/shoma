const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== FINAL VERIFICATION TEST ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(15000); // Wait for profiles to load
  
  const text = await page.innerText('body');
  const hasJosueGalRe = text.includes('JosueGalRe');
  const hasUnknown = text.includes('Unknown summoner');
  
  console.log('\n=== RESULTS ===');
  console.log('Has JosueGalRe:', hasJosueGalRe);
  console.log('Has Unknown summoner:', hasUnknown);
  
  // Check for profile icon
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
  if (hasProfileIcon) console.log('Profile icon:', profileIconSrc);
  
  await page.screenshot({ path: '/tmp/mimic-final-test-3.png', fullPage: true });
  
  await browser.close();
  
  if (hasJosueGalRe && !hasUnknown && hasProfileIcon) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Partial success:');
    console.log('  - JosueGalRe visible:', hasJosueGalRe);
    console.log('  - No Unknown summoner:', !hasUnknown);
    console.log('  - Profile icon visible:', hasProfileIcon);
    process.exit(1);
  }
})();
