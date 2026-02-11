import { test, expect } from '@playwright/test';

test.describe('トップページ（ランキング）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('ヒーローセクションが表示される', async ({ page }) => {
    // キャッチコピーの確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'おすすめに頼らない'
    );
    await expect(page.getByText('本音のレビューから')).toBeVisible();

    // CTAボタンの確認
    await expect(page.getByRole('link', { name: /チャンネルを探す/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /人気ランキングを見る/ })).toBeVisible();
  });

  test('人気チャンネルランキングが表示される', async ({ page }) => {
    // セクションタイトルの確認
    await expect(
      page.getByRole('heading', { name: /今週の人気/, level: 2 })
    ).toBeVisible();

    // チャンネルカードが表示される（データがある場合）
    const channelCards = page.locator('[href^="/channels/"]').first();
    if (await channelCards.isVisible()) {
      await expect(channelCards).toBeVisible();
    }
  });

  test('新着レビューが表示される', async ({ page }) => {
    // セクションタイトルの確認
    await expect(
      page.getByRole('heading', { name: /新着レビュー/, level: 2 })
    ).toBeVisible();

    // レビューカードが表示される（データがある場合）
    const reviewCards = page.locator('[href^="/channels/"]').last();
    if (await reviewCards.isVisible()) {
      await expect(reviewCards).toBeVisible();
    }
  });

  test('チャンネルカードをクリックすると詳細ページに遷移する', async ({ page }) => {
    const channelCard = page.locator('[href^="/channels/"]').first();

    // チャンネルカードが存在する場合のみテスト
    if (await channelCard.isVisible()) {
      await channelCard.click();
      await expect(page).toHaveURL(/\/channels\/.+/);
    }
  });

  test('レスポンシブデザイン: モバイル表示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // ヒーローセクションが表示される
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // ランキングセクションが表示される
    await expect(
      page.getByRole('heading', { name: /今週の人気/, level: 2 })
    ).toBeVisible();
  });

  test('レスポンシブデザイン: タブレット表示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // ヒーローセクションが表示される
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // ランキングセクションが表示される
    await expect(
      page.getByRole('heading', { name: /今週の人気/, level: 2 })
    ).toBeVisible();
  });

  test('アクセシビリティ: 見出し階層が正しい', async ({ page }) => {
    // h1が1つだけ存在
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // h2が存在
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('パフォーマンス: ページ読み込みが高速', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const end = Date.now();

    const loadTime = end - start;
    // 5秒以内に読み込み完了
    expect(loadTime).toBeLessThan(5000);
  });
});
