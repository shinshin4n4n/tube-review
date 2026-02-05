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
  test('デスクトップでトップページへのリンクが表示される', async ({ page }) => {
    await page.goto('/');

    const topLink = page.locator('header nav.hidden.md\\:flex a:has-text("トップ")');
    await expect(topLink).toBeVisible();
    await expect(topLink).toHaveAttribute('href', '/');
  });

  test('デスクトップで検索ページへのリンクが表示される', async ({ page }) => {
    await page.goto('/');

    const searchLink = page.locator('header nav.hidden.md\\:flex a:has-text("検索")');
    await expect(searchLink).toBeVisible();
    await expect(searchLink).toHaveAttribute('href', '/search');
  });

  test('デスクトップでマイリストページへのリンクが表示される', async ({ page }) => {
    await page.goto('/');

    const myListLink = page.locator('header nav.hidden.md\\:flex a:has-text("マイリスト")');
    await expect(myListLink).toBeVisible();
    await expect(myListLink).toHaveAttribute('href', '/my-list');
  });

  test('存在しないページへのリンク（/ranking, /new）が削除されている', async ({ page }) => {
    await page.goto('/');

    // ランキングリンクが存在しない
    const rankingLink = page.locator('header a:has-text("ランキング")');
    await expect(rankingLink).not.toBeVisible();

    // 新着リンクが存在しない
    const newLink = page.locator('header a:has-text("新着")');
    await expect(newLink).not.toBeVisible();
  });

  test('検索ページへのリンクが機能する', async ({ page }) => {
    await page.goto('/');

    await page.click('header nav.hidden.md\\:flex a:has-text("検索")');

    await expect(page).toHaveURL('/search');
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
    await page.goto('/');

    // メニューを開く
    await page.click('header button[aria-label="メニュー"]');

    // ナビゲーションリンクが表示される
    // Sheetの中のナビゲーションボタンを確認
    const nav = page.locator('[role="dialog"]');
    await expect(nav.locator('button:has-text("トップ")')).toBeVisible();
    await expect(nav.locator('button:has-text("検索")')).toBeVisible();
    await expect(nav.locator('button:has-text("マイリスト")')).toBeVisible();
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
    await page.goto('/');

    // デスクトップナビゲーションが表示される
    const desktopNav = page.locator('header nav.hidden.md\\:flex');
    await expect(desktopNav).toBeVisible();

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
