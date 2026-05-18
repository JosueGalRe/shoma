const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Capture errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`[PAGE ERROR] ${err.message}`);
  });
  
  console.log("Navigating to Sho'ma web-next...");
  await page.goto('http://172.25.208.230:5173/');
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/shoma-step1-initial.png', fullPage: true });
  
  console.log('Filling code 263542...');
  const codeInput = await page.locator('input[aria-label="Connection code"]').first();
  await codeInput.fill('263542');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/shoma-step2-code-filled.png', fullPage: true });
  
  console.log('Clicking connect...');
  const connectButton = await page.locator('button[type="submit"]').first();
  await connectButton.click();
  
  // Wait longer for connection with approval
  console.log('Waiting 15 seconds for connection approval...');
  await page.waitForTimeout(15000);
  await page.screenshot({ path: '/tmp/shoma-step3-after-wait.png', fullPage: true });
  
  // Get page content to check for specific elements
  const content = await page.content();
  const hasLobby = content.includes('lobby') || content.includes('Lobby');
  const hasSummoner = content.includes('JosueGalRe') || content.includes('Omnividiente');
  const hasConnected = content.includes('Connected') || content.includes('connected');
  const hasApproval = content.includes('WAITING FOR APPROVAL') || content.includes('approval');
  
  console.log('\n=== CONNECTION STATUS ===');
  console.log('Has Lobby UI:', hasLobby);
  console.log('Has Summoner Data:', hasSummoner);
  console.log('Has Connected State:', hasConnected);
  console.log('Waiting for Approval:', hasApproval);
  
  // Try to get current URL
  const url = page.url();
  console.log('Current URL:', url);
  
  // Try accessibility snapshot
  try {
    const snapshot = await page.accessibility.snapshot();
    console.log('\n=== PAGE STRUCTURE ===');
    console.log(JSON.stringify(snapshot, null, 2).substring(0, 2000));
  } catch (e) {
    console.log('Could not get accessibility snapshot');
  }
  
  console.log('\n=== CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));
  
  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(`[ERROR] ${err}`));
  
  // Keep browser open for a bit to see the state
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/shoma-step4-final.png', fullPage: true });
  
  await browser.close();
})();
