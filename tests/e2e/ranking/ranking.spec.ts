import { test, expect } from '@playwright/test';

test.describe('Ranking Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ranking');
  });

  test('should display ranking page', async ({ page }) => {
    // ページタイトルを確認
    await expect(page).toHaveTitle(/ランキング|Ranking/i);

    // ヘッダーが表示されていることを確認
    const heading = page.getByRole('heading', {
      name: /ランキング|Ranking/i,
    });
    await expect(heading).toBeVisible();
  });

  test('should display total ranking', async ({ page }) => {
    // 総合ランキングが表示されていることを確認
    const totalRanking = page.getByText(/総合ランキング|Total Ranking/i);
    await expect(totalRanking).toBeVisible();

    // ランキング項目が表示されていることを確認
    const rankingItems = page.locator('[data-testid="ranking-item"]');
    await expect(rankingItems.first()).toBeVisible();
  });

  test('should display category ranking', async ({ page }) => {
    // カテゴリタブがある場合、クリック
    const categoryTab = page.getByRole('tab', { name: /カテゴリ/i }).first();

    if (await categoryTab.isVisible()) {
      await categoryTab.click();

      // カテゴリ別ランキングが表示されることを確認
      await expect(
        page.locator('[data-testid="category-ranking"]')
      ).toBeVisible();
    }
  });

  test('should navigate through pagination', async ({ page }) => {
    // ページネーションが存在する場合
    const nextButton = page.getByRole('button', { name: /次へ|Next/i });

    if (await nextButton.isVisible()) {
      // 現在のページ番号を確認
      const currentPage = await page
        .locator('[data-testid="current-page"]')
        .textContent();

      // 次のページに移動
      await nextButton.click();

      // URLが変更されることを確認
      await expect(page).toHaveURL(/page=2/);

      // 新しいページ番号が表示されることを確認
      if (currentPage) {
        const newPage = await page
          .locator('[data-testid="current-page"]')
          .textContent();
        expect(newPage).not.toBe(currentPage);
      }
    }
  });

  test('should display channel details from ranking', async ({ page }) => {
    // ランキング項目をクリック
    const firstItem = page.locator('[data-testid="ranking-item"]').first();

    if (await firstItem.isVisible()) {
      await firstItem.click();

      // チャンネル詳細ページに遷移することを確認
      await expect(page).toHaveURL(/channels\/[^/]+/);

      // チャンネル詳細が表示されることを確認
      await expect(
        page.locator('[data-testid="channel-details"]')
      ).toBeVisible();
    }
  });

  test('should display ranking metrics', async ({ page }) => {
    // ランキング項目に評価やレビュー数が表示されていることを確認
    const firstItem = page.locator('[data-testid="ranking-item"]').first();

    if (await firstItem.isVisible()) {
      // 順位が表示されていることを確認
      await expect(firstItem.locator('[data-testid="rank"]')).toBeVisible();

      // 評価が表示されていることを確認
      await expect(firstItem.locator('[data-testid="rating"]')).toBeVisible();
    }
  });
});
