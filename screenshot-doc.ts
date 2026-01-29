import { chromium } from 'playwright';

async function captureDocument() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark'
  });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3001');
  await page.fill('input[type="email"]', 'armaan@missioncontrol.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });

  // Go to document
  await page.goto('http://localhost:3001/dashboard/documents/welcome');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/ubuntu/mission-control/screenshots/09-document-view.png', fullPage: true });
  console.log('✅ Document view captured');

  await browser.close();
}

captureDocument().catch(console.error);
