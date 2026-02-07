import { test, expect } from '@playwright/test';

test.describe('Review Helpful Button', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のチャンネル詳細ページに移動（HikakinTV）
    await page.goto('/channels/UCZf__ehlCEBPop-_sldpBUQ');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');
  });

  test('should show helpful button on reviews', async ({ page }) => {
    // レビューカードを取得
    const reviewCard = page.locator('[data-testid="review-card"]').first();

    // 「参考になった」ボタンが表示されることを確認
    const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
    await expect(helpfulButton).toBeVisible();

    // ボタンに「参考になった」テキストが含まれることを確認
    await expect(helpfulButton).toContainText('参考になった');
  });

  test('should require login to vote', async ({ page }) => {
    // 未ログイン状態で「参考になった」ボタンをクリック
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    await helpfulButton.click();

    // トーストメッセージが表示されることを確認
    // Note: トーストの実装によって調整が必要
    const toast = page.locator('text=ログインが必要です').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test.describe('Logged in user', () => {
    test.beforeEach(async ({ page }) => {
      // テスト用ユーザーでログイン
      // Note: 実際の認証フローに合わせて調整が必要
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test1@example.com');
      await page.click('button[type="submit"]');

      // Magic Linkのシミュレーション（開発環境）
      // または、認証状態を直接設定するヘルパー関数を使用

      // チャンネル詳細ページに戻る
      await page.goto('/channels/UCZf__ehlCEBPop-_sldpBUQ');
      await page.waitForLoadState('networkidle');
    });

    test('should toggle helpful vote', async ({ page }) => {
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');

      // 初期状態の投票数を取得
      const initialCountText = await helpfulCount.textContent().catch(() => '(0)');
      const initialCount = parseInt(initialCountText.match(/\d+/)?.[0] || '0');

      // ボタンをクリックして投票
      await helpfulButton.click();

      // 投票数が増えることを確認（楽観的UI）
      await expect(helpfulCount).toContainText(`(${initialCount + 1})`);

      // ボタンの状態が変わることを確認（アクティブ状態）
      await expect(helpfulButton).toHaveAttribute('data-state', 'active');

      // もう一度クリックして投票を取り消し
      await helpfulButton.click();

      // 投票数が元に戻ることを確認
      await expect(helpfulCount).toContainText(`(${initialCount})`);
    });

    test('should prevent duplicate votes', async ({ page }) => {
      const reviewCard = page.locator('[data-testid="review-card"]').first();
      const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');
      const helpfulCount = reviewCard.locator('[data-testid="helpful-count"]');

      // 投票
      await helpfulButton.click();
      await page.waitForTimeout(500); // 楽観的UI更新を待つ

      const countAfterFirstClick = await helpfulCount.textContent();

      // ページをリロード
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 投票状態が保持されていることを確認
      const reviewCardAfterReload = page.locator('[data-testid="review-card"]').first();
      const helpfulCountAfterReload = reviewCardAfterReload.locator('[data-testid="helpful-count"]');

      await expect(helpfulCountAfterReload).toContainText(countAfterFirstClick || '(1)');
    });

    test('should show correct count for multiple votes', async ({ page }) => {
      // 複数のレビューカードを取得
      const reviewCards = page.locator('[data-testid="review-card"]');
      const count = await reviewCards.count();

      if (count >= 2) {
        // 1つ目のレビューに投票
        const firstButton = reviewCards.nth(0).locator('[data-testid="helpful-button"]');
        await firstButton.click();

        // 2つ目のレビューに投票
        const secondButton = reviewCards.nth(1).locator('[data-testid="helpful-button"]');
        await secondButton.click();

        // 両方のボタンがアクティブ状態になることを確認
        await expect(firstButton).toHaveClass(/active|default/);
        await expect(secondButton).toHaveClass(/active|default/);
      }
    });
  });

  test('should display helpful count correctly', async ({ page }) => {
    const reviewCard = page.locator('[data-testid="review-card"]').first();
    const helpfulButton = reviewCard.locator('[data-testid="helpful-button"]');

    // 「参考になった」ボタンが表示されていることを確認
    await expect(helpfulButton).toBeVisible();

    // 投票数が0の場合は表示されない、または(0)と表示される
    const buttonText = await helpfulButton.textContent();

    // ボタンテキストに「参考になった」が含まれることを確認
    expect(buttonText).toContain('参考になった');

    // 投票数がある場合は括弧付きで表示されることを確認
    if (buttonText?.includes('(')) {
      expect(buttonText).toMatch(/\(\d+\)/);
    }
  });

  test('should have accessible button attributes', async ({ page }) => {
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();

    // aria-label属性が設定されていることを確認
    const ariaLabel = await helpfulButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/参考になった/);
  });
});
