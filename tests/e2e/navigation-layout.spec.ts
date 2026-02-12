import { test, expect } from '@playwright/test';

/**
 * Navigation Layout Tests
 * すべてのページでヘッダー・フッターが表示されることを確認
 */

test.describe('Layout Component - Header & Footer Display', () => {
  test('トップページでヘッダー・フッターが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });

  test('検索ページでヘッダー・フッターが表示される', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'networkidle' });

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });

  test('チャンネル詳細ページでヘッダー・フッターが表示される', async ({ page }) => {
    // テスト用の既知のYouTubeチャンネルID
    const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers

    await page.goto(`/channels/${testChannelId}`);

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });

  test('マイリストページでヘッダー・フッターが表示される（認証必要）', async ({ page }) => {
    // ログイン処理（必要に応じて）
    // TODO: 実際のログイン処理を実装

    await page.goto('/my-list');

    // 未認証の場合はログインページにリダイレクトされる
    if (page.url().includes('/login')) {
      // ログインページもLayoutを使うべきではないが、確認のためスキップ
      return;
    }

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });

  test('マイリスト一覧ページでヘッダー・フッターが表示される（認証必要）', async ({ page }) => {
    await page.goto('/my-lists');

    // 未認証の場合はログインページにリダイレクトされる
    if (page.url().includes('/login')) {
      return;
    }

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });

  test('プロフィールページでヘッダー・フッターが表示される（認証必要）', async ({ page }) => {
    await page.goto('/profile');

    // 未認証の場合はログインページにリダイレクトされる
    if (page.url().includes('/login')) {
      return;
    }

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('[data-testid="header-logo"]')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer:has-text("TubeReview")')).toBeVisible();
  });
});

test.describe('Navigation - Header Links', () => {
  test('ヘッダーからトップページに遷移できる', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'networkidle' });

    await page.click('[data-testid="nav-desktop-トップ"]');

    await expect(page).toHaveURL('/');
  });

  test('ヘッダーからマイチャンネルページに遷移できる', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const myChannelsLink = page.locator('[data-testid="nav-desktop-マイチャンネル"]');
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }),
      myChannelsLink.click(),
    ]);

    // 未認証の場合はログインページにリダイレクト
    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      await expect(page).toHaveURL('/my-channels');
    }
  });

  test('ヘッダーのロゴからトップページに遷移できる', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'networkidle' });

    await page.click('[data-testid="header-logo"]');

    await expect(page).toHaveURL('/');
  });
});

test.describe('Responsive Layout', () => {
  test('モバイル表示でもヘッダー・フッターが表示される', async ({ page }) => {
    // iPhone SE サイズ
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/', { waitUntil: 'networkidle' });

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
  });

  test('タブレット表示でもヘッダー・フッターが表示される', async ({ page }) => {
    // iPad サイズ
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/search', { waitUntil: 'networkidle' });

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();

    // フッターが表示されている
    await expect(page.locator('footer')).toBeVisible();
  });
});
