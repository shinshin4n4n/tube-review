import { test, expect } from '@playwright/test';

test.describe('Header Two-Tier Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003');
  });

  test('デスクトップ: 2段構成のヘッダーが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // ヘッダーが表示される
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // 1行目: ロゴ、検索窓、ユーザーメニューが表示される
    await expect(page.getByRole('link', { name: 'ちゅぶれびゅ！' })).toBeVisible();
    await expect(page.getByPlaceholder('チャンネルを検索...')).toBeVisible();

    // 2行目: ナビゲーションメニューが表示される
    const nav = page.locator('nav').last();
    await expect(nav.getByRole('link', { name: 'トップ' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'ランキング' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'カテゴリー' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'マイリスト' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'ちゅぶれびゅ！とは' })).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-desktop.png', fullPage: true });
  });

  test('タブレット: ヘッダーが適切に表示される', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // ヘッダーが表示される
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // ロゴと検索窓が表示される
    await expect(page.getByRole('link', { name: 'ちゅぶれびゅ！' })).toBeVisible();
    await expect(page.getByPlaceholder('チャンネルを検索...')).toBeVisible();

    // ナビゲーションメニューが表示される
    const nav = page.locator('nav').last();
    await expect(nav.getByRole('link', { name: 'トップ' })).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-tablet.png', fullPage: true });
  });

  test('モバイル: 検索アイコンとハンバーガーメニューが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // ヘッダーが表示される
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // ロゴが表示される
    await expect(page.getByRole('link', { name: 'ちゅぶれびゅ！' })).toBeVisible();

    // 検索アイコンが表示される（検索窓は非表示）
    const searchButton = page.getByRole('button', { name: '検索' });
    await expect(searchButton).toBeVisible();

    // ハンバーガーメニューが表示される
    const menuButton = page.getByRole('button', { name: 'メニュー' });
    await expect(menuButton).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-mobile.png', fullPage: true });
  });

  test('モバイル: 検索アイコンをクリックすると検索窓が展開される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // 検索アイコンをクリック
    const searchButton = page.getByRole('button', { name: '検索' });
    await searchButton.click();

    // 検索窓が表示される
    await expect(page.getByPlaceholder('チャンネルを検索...')).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-mobile-search-open.png', fullPage: true });
  });

  test('ナビゲーション: アクティブページがハイライトされる', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // トップページ（ホーム）のアクティブ状態を確認
    const homeLink = page.locator('nav').last().getByRole('link', { name: 'トップ' });
    await expect(homeLink).toHaveClass(/bg-white\/20/);

    // カテゴリーページに移動
    await page.goto('http://localhost:3003/categories');
    const categoryLink = page.locator('nav').last().getByRole('link', { name: 'カテゴリー' });
    await expect(categoryLink).toHaveClass(/bg-white\/20/);

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-active-state.png', fullPage: true });
  });

  test('検索機能: 検索窓から検索できる', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // 検索窓に入力
    const searchInput = page.getByPlaceholder('チャンネルを検索...');
    await searchInput.fill('テスト');

    // Enterキーを押す
    await searchInput.press('Enter');

    // 検索ページに遷移することを確認
    await expect(page).toHaveURL(/\/search\?q=テスト/);
  });

  test('Sticky Header: スクロール時もヘッダーが固定される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // ページをスクロール
    await page.evaluate(() => window.scrollTo(0, 500));

    // ヘッダーが表示されたままであることを確認
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // スクリーンショット撮影
    await page.screenshot({ path: 'tests/screenshots/header-sticky.png', fullPage: true });
  });
});
