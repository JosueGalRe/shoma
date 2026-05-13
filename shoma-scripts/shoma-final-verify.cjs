const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== FINAL VERIFICATION ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000); // Wait for connection
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(8000); // Wait for lobby data to load with new timeout
  
  const text = await page.innerText('body');
  const hasJosueGalRe = text.includes('JosueGalRe');
  const hasUnknown = text.includes('Unknown summoner');
  const hasOmnividiente = text.includes('Omnividiente');
  const hasDiamante = text.includes('Diamante');
  
  console.log('\n=== VERIFICATION RESULTS ===');
  console.log('✅ Has JosueGalRe:', hasJosueGalRe);
  console.log('✅ No Unknown summoner:', !hasUnknown);
  console.log('ℹ️ Has Omnividiente:', hasOmnividiente);
  console.log('ℹ️ Has Diamante:', hasDiamante);
  
  // Check for profile icon
  const images = await page.locator('img').all();
  let hasProfileIcon = false;
  for (const img of images) {
    const src = await img.getAttribute('src');
    if (src?.includes('profileicon')) {
      console.log('✅ Profile icon found:', src);
      hasProfileIcon = true;
      break;
    }
  }
  if (!hasProfileIcon) {
    console.log('⚠️ No profile icon found');
  }
  
  await page.screenshot({ path: '/tmp/shoma-final-verify.png', fullPage: true });
  
  await browser.close();
  
  if (hasJosueGalRe && !hasUnknown) {
    console.log('\n🎉 SUCCESS: Summoner profile is now displayed correctly!');
    process.exit(0);
  } else {
    console.log('\n❌ FAILED: Summoner profile still not displayed correctly');
    process.exit(1);
  }
})();
