const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  console.log("Navigating to Sho'ma web-next...");
  await page.goto('http://172.25.208.230:5173/');
  
  await page.waitForTimeout(2000);
  
  console.log('Taking initial screenshot...');
  await page.screenshot({ path: '/tmp/shoma-initial.png', fullPage: true });
  
  console.log('Looking for code input...');
  const codeInput = await page.locator('input[aria-label="Connection code"]').first();
  
  if (await codeInput.isVisible().catch(() => false)) {
    console.log('Filling code 263542...');
    await codeInput.fill('263542');
    
    console.log('Clicking connect button...');
    const connectButton = await page.locator('button[type="submit"]').first();
    await connectButton.click();
    
    console.log('Waiting for connection...');
    await page.waitForTimeout(5000);
    
    console.log('Taking connected screenshot...');
    await page.screenshot({ path: '/tmp/shoma-connected.png', fullPage: true });
    
    // Check for summoner name
    const pageContent = await page.content();
    if (pageContent.includes('JosueGalRe') || pageContent.includes('Omnividiente')) {
      console.log('SUCCESS: Summoner data found!');
    } else {
      console.log('Checking for lobby data...');
    }
  } else {
    console.log('Code input not found. Current page state:');
    const snapshot = await page.accessibility.snapshot();
    console.log(JSON.stringify(snapshot, null, 2));
  }
  
  await browser.close();
})();
