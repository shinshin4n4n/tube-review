const playwright = require('@playwright/test');

async function captureScreenshots() {
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('デスクトップビューをキャプチャ中...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/header-desktop.png', fullPage: true });
    console.log('✓ デスクトップビュー完了');

    console.log('タブレットビューをキャプチャ中...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/header-tablet.png', fullPage: true });
    console.log('✓ タブレットビュー完了');

    console.log('モバイルビューをキャプチャ中...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/screenshots/header-mobile.png', fullPage: true });
    console.log('✓ モバイルビュー完了');

    console.log('\nすべてのスクリーンショットが正常にキャプチャされました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
