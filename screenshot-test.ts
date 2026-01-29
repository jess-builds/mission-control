import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = '/home/ubuntu/mission-control/screenshots';

async function captureScreenshots() {
  console.log('📸 Starting visual audit...\n');
  
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark'
  });
  const page = await context.newPage();

  try {
    // 1. Login page
    console.log('📋 Capturing Login page...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login.png'), fullPage: true });
    console.log('   ✅ Login captured');

    // 2. Login and go to dashboard
    await page.fill('input[type="email"]', 'armaan@missioncontrol.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    console.log('📋 Capturing Dashboard...');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard.png'), fullPage: true });
    console.log('   ✅ Dashboard captured');

    // 3. Tasks page
    console.log('📋 Capturing Tasks page...');
    await page.click('a[href="/dashboard/tasks"]');
    await page.waitForURL('**/tasks**');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-tasks.png'), fullPage: true });
    console.log('   ✅ Tasks captured');

    // 4. Documents page
    console.log('📋 Capturing Documents page...');
    await page.click('a[href="/dashboard/documents"]');
    await page.waitForURL('**/documents**');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-documents.png'), fullPage: true });
    console.log('   ✅ Documents captured');

    // 5. Journal page
    console.log('📋 Capturing Journal page...');
    await page.click('a[href="/dashboard/journal"]');
    await page.waitForURL('**/journal**');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-journal.png'), fullPage: true });
    console.log('   ✅ Journal captured');

    // 6. Search page
    console.log('📋 Capturing Search page...');
    await page.click('a[href="/dashboard/search"]');
    await page.waitForURL('**/search**');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-search.png'), fullPage: true });
    console.log('   ✅ Search captured');

    // 7. Quick capture modal
    console.log('📋 Capturing Quick Capture modal...');
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-quick-capture.png') });
    console.log('   ✅ Quick Capture captured');
    await page.keyboard.press('Escape');

    // 8. Keyboard shortcuts modal
    console.log('📋 Capturing Keyboard Shortcuts...');
    await page.keyboard.press('Meta+Shift+?');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-shortcuts.png') });
    console.log('   ✅ Shortcuts captured');

    console.log('\n✅ All screenshots captured in:', SCREENSHOTS_DIR);
    console.log('\nScreenshots:');
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    files.forEach(f => console.log('  -', f));

  } catch (err) {
    console.error('❌ Error:', err);
  }

  await browser.close();
}

captureScreenshots().catch(console.error);
