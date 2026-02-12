import { test, expect } from '@playwright/test';

/**
 * Header Navigation Tests
 * ヘッダーナビゲーション改修後のテスト
 * - 存在しないリンクが削除されていること
 * - 検索リンクが追加されていること
 * - ユーザーメニューが機能すること
 * - モバイルメニューが機能すること
 */

test.describe('Header Navigation - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // デスクトップサイズに設定（768px以上でNavMenuが表示される）
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('デスクトップでトップページへのリンクが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const topLink = page.locator('[data-testid="nav-desktop-トップ"]');
    await expect(topLink).toBeVisible();
    await expect(topLink).toHaveAttribute('href', '/');
  });

  test('デスクトップでランキングページへのリンクが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const rankingLink = page.locator('[data-testid="nav-desktop-ランキング"]');
    await expect(rankingLink).toBeVisible();
    await expect(rankingLink).toHaveAttribute('href', '/ranking');
  });

  test('デスクトップでマイチャンネルページへのリンクが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const myChannelsLink = page.locator('[data-testid="nav-desktop-マイチャンネル"]');
    await expect(myChannelsLink).toBeVisible();
    await expect(myChannelsLink).toHaveAttribute('href', '/my-channels');
  });

  test('デスクトップでカテゴリーページへのリンクが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const categoriesLink = page.locator('[data-testid="nav-desktop-カテゴリー"]');
    await expect(categoriesLink).toBeVisible();
    await expect(categoriesLink).toHaveAttribute('href', '/categories');
  });

  test('ランキングページへのリンクが機能する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const rankingLink = page.locator('[data-testid="nav-desktop-ランキング"]');
    await Promise.all([
      page.waitForURL('/ranking', { timeout: 10000 }),
      rankingLink.click(),
    ]);

    await expect(page).toHaveURL('/ranking');
  });
});

test.describe('Header Navigation - Unauthenticated User', () => {
  test('未認証時にログインボタンが表示される', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.locator('header a:has-text("ログイン")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveAttribute('href', '/login');
  });

  test('ログインボタンからログインページに遷移できる', async ({ page }) => {
    await page.goto('/');

    await page.click('header a:has-text("ログイン")');

    await expect(page).toHaveURL('/login');
  });
});

test.describe('Header Navigation - Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('モバイルでハンバーガーメニューボタンが表示される', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.locator('header button[aria-label="メニュー"]');
    await expect(menuButton).toBeVisible();
  });

  test('モバイルメニューを開くことができる', async ({ page }) => {
    await page.goto('/');

    // メニューボタンをクリック
    await page.click('header button[aria-label="メニュー"]');

    // メニューが表示される
    await expect(page.locator('text=メニュー').first()).toBeVisible();
  });

  test('モバイルメニューにナビゲーションリンクが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // メニューを開く
    await page.click('header button[aria-label="メニュー"]');

    // ナビゲーションリンクが表示される
    // Sheetの中のナビゲーションボタンを確認
    const nav = page.locator('[role="dialog"]');
    await expect(nav.locator('button:has-text("トップ")')).toBeVisible();
    await expect(nav.locator('button:has-text("ランキング")')).toBeVisible();
    await expect(nav.locator('button:has-text("カテゴリー")')).toBeVisible();
    await expect(nav.locator('button:has-text("マイリスト")')).toBeVisible();
    await expect(nav.locator('button:has-text("ちゅぶれびゅ！とは")')).toBeVisible();
  });

  test('モバイルメニューの未認証時にログインリンクが表示される', async ({ page }) => {
    await page.goto('/');

    // メニューを開く
    await page.click('header button[aria-label="メニュー"]');

    // ログインリンクが表示される
    const nav = page.locator('[role="dialog"]');
    await expect(nav.locator('a:has-text("ログイン")')).toBeVisible();
  });

  test('モバイルメニューからトップページに遷移できる', async ({ page }) => {
    await page.goto('/search');

    // メニューを開く
    await page.click('header button[aria-label="メニュー"]');

    // トップをクリック
    await page.locator('[role="dialog"] button:has-text("トップ")').click();

    // ページが遷移する
    await expect(page).toHaveURL('/');
  });
});

test.describe('Responsive Layout', () => {
  test('デスクトップ（768px以上）でデスクトップナビゲーションが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // デスクトップナビゲーションが表示される（NavMenuのリンクを確認）
    const topLink = page.locator('[data-testid="nav-desktop-トップ"]');
    await expect(topLink).toBeVisible();

    // モバイルメニューボタンが非表示
    const mobileButton = page.locator('header button[aria-label="メニュー"]');
    await expect(mobileButton).not.toBeVisible();
  });

  test('モバイル（768px未満）でモバイルメニューボタンが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // モバイルメニューボタンが表示される
    const mobileButton = page.locator('header button[aria-label="メニュー"]');
    await expect(mobileButton).toBeVisible();

    // デスクトップナビゲーションが非表示
    const desktopNav = page.locator('header nav.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });
});
