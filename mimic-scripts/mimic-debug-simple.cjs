const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    executablePath: '/home/josuegalre/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    headless: false 
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  console.log('=== SIMPLE DEBUG ===');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  await page.locator('input[aria-label="Connection code"]').first().fill('263542');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(12000);
  
  const dashboardLink = page.locator('a:has-text("Open connected dashboard")').first();
  if (await dashboardLink.isVisible().catch(() => false)) {
    await dashboardLink.click();
  }
  
  await page.waitForTimeout(20000);
  
  // Get member card content
  const memberCard = await page.evaluate(() => {
    const allDivs = Array.from(document.querySelectorAll('div'));
    const targetDiv = allDivs.find(el => {
      const text = el.textContent || '';
      return text.includes('MIDDLE / FILL') || text.includes('Unknown summoner');
    });
    
    if (targetDiv) {
      // Walk up to find the card container
      let card = targetDiv;
      for (let i = 0; i < 5; i++) {
        if (card.parentElement && card.parentElement.children.length <= 3) {
          card = card.parentElement;
        } else {
          break;
        }
      }
      return {
        text: card.textContent?.substring(0, 500),
        className: card.className,
      };
    }
    return null;
  });
  
  console.log('\nMember card content:', memberCard);
  
  // Get all text on page
  const pageText = await page.innerText('body');
  console.log('\nPage text (first 2000 chars):');
  console.log(pageText.substring(0, 2000));
  
  await page.screenshot({ path: '/tmp/mimic-debug-simple.png', fullPage: true });
  await browser.close();
})();
