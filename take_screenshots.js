import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  
  // Loom screenshots (mobile viewport)
  const loomContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const loomPage = await loomContext.newPage();
  
  console.log('Navigating to Loom home...');
  await loomPage.goto('http://localhost:5176/');
  await loomPage.waitForLoadState('networkidle');
  await loomPage.screenshot({ path: '.sisyphus/evidence/f3-loom-home.png' });
  
  console.log('Navigating to Loom connected...');
  await loomPage.goto('http://localhost:5176/connected');
  await loomPage.waitForLoadState('networkidle');
  await loomPage.screenshot({ path: '.sisyphus/evidence/f3-loom-connected.png' });
  
  console.log('Navigating to Loom lobby...');
  await loomPage.goto('http://localhost:5176/connected/lobby');
  await loomPage.waitForLoadState('networkidle');
  await loomPage.screenshot({ path: '.sisyphus/evidence/f3-loom-lobby.png' });
  
  await loomContext.close();
  
  // Conduit screenshots (desktop viewport)
  const conduitContext = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const conduitPage = await conduitContext.newPage();
  
  console.log('Navigating to Conduit UI...');
  await conduitPage.goto('http://localhost:1420/');
  await conduitPage.waitForLoadState('networkidle');
  await conduitPage.screenshot({ path: '.sisyphus/evidence/f3-conduit-ui.png' });
  
  await conduitContext.close();
  await browser.close();
  
  console.log('Screenshots captured successfully.');
})();
