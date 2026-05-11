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
  
  try {
    console.log('=== CONNECTING ===');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    // Check if already connected or needs code
    const bodyText = await page.innerText('body');
    if (bodyText.includes('Connected')) {
      console.log('Already connected!');
    } else {
      await page.locator('input[aria-label="Connection code"]').first().fill('263542');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(10000);
    }
    
    await page.screenshot({ path: '/tmp/mimic-final-1-connect.png', fullPage: true });
    
    // Navigate to dashboard
    console.log('=== NAVIGATING TO DASHBOARD ===');
    const dashboardLink = page.locator('a, button').filter({ hasText: /dashboard/i }).first();
    if (await dashboardLink.isVisible().catch(() => false)) {
      await dashboardLink.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('Lobby URL:', page.url());
    await page.screenshot({ path: '/tmp/mimic-final-2-lobby.png', fullPage: true });
    
    // Capture lobby text
    const lobbyText = await page.innerText('body');
    console.log('\n--- LOBBY CONTENT ---');
    console.log(lobbyText.substring(0, 2000));
    
    // Navigate to Invites
    console.log('\n=== NAVIGATING TO INVITES ===');
    const invitesLink = page.locator('a').filter({ hasText: /Invites/i }).first();
    if (await invitesLink.isVisible().catch(() => false)) {
      await invitesLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/mimic-final-3-invites.png', fullPage: true });
      console.log('Invites URL:', page.url());
    }
    
    // Navigate to Champ Select
    console.log('\n=== NAVIGATING TO CHAMP SELECT ===');
    const champSelectLink = page.locator('a').filter({ hasText: /Champ Select/i }).first();
    if (await champSelectLink.isVisible().catch(() => false)) {
      await champSelectLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/mimic-final-4-champselect.png', fullPage: true });
      console.log('Champ Select URL:', page.url());
    }
    
    // Back to Lobby
    console.log('\n=== BACK TO LOBBY ===');
    const lobbyLink = page.locator('a').filter({ hasText: /^Lobby$/i }).first();
    if (await lobbyLink.isVisible().catch(() => false)) {
      await lobbyLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/mimic-final-5-lobby-return.png', fullPage: true });
    }
    
  } catch (e) {
    console.error('Test failed:', e.message);
    await page.screenshot({ path: '/tmp/mimic-final-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('\n=== TEST COMPLETE ===');
})();
