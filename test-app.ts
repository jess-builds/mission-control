import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3001';

async function testApp() {
  console.log('🚀 Starting Mission Control test suite...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const passed: string[] = [];
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(`Page error: ${err.message}`);
  });

  try {
    // Test 1: Login page loads
    console.log('📋 Test 1: Login page');
    await page.goto(BASE_URL);
    await page.waitForTimeout(500);
    const loginTitle = await page.textContent('h1');
    if (loginTitle?.includes('Mission Control')) {
      passed.push('✅ Login page loads correctly');
    } else {
      errors.push('❌ Login page title not found');
    }
    
    // Test 2: Login works
    console.log('📋 Test 2: Login flow');
    await page.fill('input[type="email"]', 'armaan@missioncontrol.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    passed.push('✅ Login successful, redirected to dashboard');
    
    // Test 3: Dashboard loads
    console.log('📋 Test 3: Dashboard');
    const welcomeText = await page.textContent('h1');
    if (welcomeText?.includes('Welcome')) {
      passed.push('✅ Dashboard loads with welcome message');
    } else {
      errors.push('❌ Dashboard welcome message not found');
    }
    
    // Test 4: Stats cards visible
    const statCards = await page.locator('[data-slot="card"]').count();
    if (statCards >= 4) {
      passed.push(`✅ Dashboard shows ${statCards} stat cards`);
    } else {
      warnings.push(`⚠️ Only ${statCards} stat cards found (expected 4+)`);
    }
    
    // Test 5: Navigate to Tasks
    console.log('📋 Test 4: Tasks page');
    await page.click('a[href="/dashboard/tasks"]');
    await page.waitForURL('**/tasks**');
    const tasksHeading = await page.textContent('h1');
    if (tasksHeading?.includes('Tasks')) {
      passed.push('✅ Tasks page loads');
    } else {
      errors.push('❌ Tasks page heading not found');
    }
    
    // Test 6: Kanban columns exist
    const columns = await page.locator('.space-y-3 > div').count();
    if (columns >= 4) {
      passed.push(`✅ Kanban board has ${columns} columns`);
    } else {
      warnings.push(`⚠️ Only ${columns} kanban columns found`);
    }
    
    // Test 7: Navigate to Documents
    console.log('📋 Test 5: Documents page');
    await page.click('a[href="/dashboard/documents"]');
    await page.waitForURL('**/documents**');
    passed.push('✅ Documents page loads');
    
    // Test 8: Navigate to Journal
    console.log('📋 Test 6: Journal page');
    await page.click('a[href="/dashboard/journal"]');
    await page.waitForURL('**/journal**');
    passed.push('✅ Journal page loads');
    
    // Test 9: Quick Capture (Cmd+K)
    console.log('📋 Test 7: Quick Capture modal');
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const quickCaptureVisible = await page.locator('[role="dialog"], [data-state="open"]').isVisible();
    if (quickCaptureVisible) {
      passed.push('✅ Quick Capture modal opens with ⌘+K');
      await page.keyboard.press('Escape');
    } else {
      warnings.push('⚠️ Quick Capture modal not opening with ⌘+K');
    }
    
    // Test 10: Theme toggle
    console.log('📋 Test 8: Theme toggle');
    const themeToggle = await page.locator('button:has-text("theme"), button[aria-label*="theme"], button:has(svg)').first();
    if (await themeToggle.isVisible()) {
      passed.push('✅ Theme toggle button exists');
    } else {
      warnings.push('⚠️ Theme toggle not found');
    }
    
  } catch (err) {
    errors.push(`❌ Test failed: ${err}`);
  }
  
  await browser.close();
  
  // Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\n✅ PASSED (' + passed.length + '):');
  passed.forEach(p => console.log('  ' + p));
  
  if (warnings.length > 0) {
    console.log('\n⚠️ WARNINGS (' + warnings.length + '):');
    warnings.forEach(w => console.log('  ' + w));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (' + errors.length + '):');
    errors.forEach(e => console.log('  ' + e));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${passed.length} passed, ${warnings.length} warnings, ${errors.length} errors`);
  console.log('='.repeat(60));
  
  return { passed, warnings, errors };
}

testApp().catch(console.error);
