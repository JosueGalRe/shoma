const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });
  
  console.log('Navigating to localhost...');
  await page.goto('http://localhost:5173/');
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/mimic-localhost-initial.png', fullPage: true });
  
  console.log('Filling code...');
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  
  console.log('Waiting 20 seconds for connection...');
  await page.waitForTimeout(20000);
  await page.screenshot({ path: '/tmp/mimic-localhost-connected.png', fullPage: true });
  
  const url = page.url();
  const content = await page.content();
  console.log('URL:', url);
  console.log('Has Lobby:', content.includes('lobby') || content.includes('Lobby'));
  console.log('Has Summoner:', content.includes('JosueGalRe'));
  console.log('Has Connected:', content.includes('Connected'));
  
  console.log('\nConsole logs:');
  consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));
  
  await browser.close();
})();
