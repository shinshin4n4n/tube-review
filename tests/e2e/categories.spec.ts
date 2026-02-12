import { test, expect } from '@playwright/test';

test.describe('カテゴリーページ', () => {
  test.describe('カテゴリー一覧ページ', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/categories');
    });

    test('カテゴリー一覧ページが表示される', async ({ page }) => {
      // ページタイトルを確認
      await expect(page).toHaveTitle(/カテゴリー一覧/);

      // ヘッダーを確認
      await expect(
        page.getByRole('heading', { name: 'カテゴリー一覧', level: 1 })
      ).toBeVisible();
    });

    test('カテゴリーカードが表示される', async ({ page }) => {
      // カテゴリーカードが存在することを確認
      const categoryCards = page.locator('[data-testid="category-card"]');
      const count = await categoryCards.count();

      // 少なくとも1つのカテゴリーカードが表示される（データがある場合）
      if (count > 0) {
        await expect(categoryCards.first()).toBeVisible();
      }
    });

    test('カテゴリーカードに必要な情報が表示される', async ({ page }) => {
      const categoryCards = page.locator('[data-testid="category-card"]');
      const count = await categoryCards.count();

      if (count > 0) {
        const firstCard = categoryCards.first();

        // カテゴリー名が表示される
        await expect(firstCard.locator('h3')).toBeVisible();

        // チャンネル数が表示される（より具体的なセレクターを使用）
        await expect(firstCard.getByText(/\d+ チャンネル/)).toBeVisible();
      }
    });

    test('カテゴリーカードをクリックするとカテゴリー詳細ページに遷移する', async ({
      page,
    }) => {
      const categoryCards = page.locator('[data-testid="category-card"]');
      const count = await categoryCards.count();

      if (count > 0) {
        // 最初のカテゴリーカードをクリック
        await categoryCards.first().click();

        // カテゴリー詳細ページに遷移
        await expect(page).toHaveURL(/\/categories\/.+/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('カテゴリー詳細ページ', () => {
    test('カテゴリー詳細ページにアクセスできる', async ({ page }) => {
      // エンタメカテゴリーにアクセス
      await page.goto('/categories/entertainment');

      // ページが表示される
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('戻るボタンが表示される', async ({ page }) => {
      await page.goto('/categories/entertainment');

      // 戻るボタンが表示される
      const backButton = page.locator('[data-testid="back-button"]');
      await expect(backButton).toBeVisible();
    });

    test('戻るボタンをクリックすると前のページに戻る', async ({ page }) => {
      // カテゴリー一覧ページから遷移
      await page.goto('/categories');
      const categoryCards = page.locator('[data-testid="category-card"]');
      const count = await categoryCards.count();

      if (count > 0) {
        await categoryCards.first().click();
        await expect(page).toHaveURL(/\/categories\/.+/);

        // 戻るボタンをクリック
        const backButton = page.locator('[data-testid="back-button"]');
        await backButton.click();

        // カテゴリー一覧ページに戻る
        await expect(page).toHaveURL('/categories');
      } else {
        test.skip();
      }
    });

    test('ソート機能が表示される', async ({ page }) => {
      await page.goto('/categories/entertainment');

      // ソートボタンが表示される
      await expect(page.getByText('人気順')).toBeVisible();
      await expect(page.getByText('新着順')).toBeVisible();
      await expect(page.getByText('登録者数順')).toBeVisible();
    });

    test('ソートボタンをクリックするとURLが変わる', async ({ page }) => {
      await page.goto('/categories/entertainment');

      // 新着順ボタンをクリック
      await page.getByText('新着順').click();

      // URLにsortパラメータが追加される
      await expect(page).toHaveURL(/sort=latest/);
    });

    test('チャンネルが表示される', async ({ page }) => {
      await page.goto('/categories/entertainment');

      // チャンネルカードが表示される（データがある場合）
      const channelCards = page.locator('[data-testid="channel-card"]');
      const count = await channelCards.count();

      if (count > 0) {
        await expect(channelCards.first()).toBeVisible();
      }
    });

    test('チャンネルカードをクリックするとチャンネル詳細ページに遷移する', async ({
      page,
    }) => {
      await page.goto('/categories/entertainment');

      const channelCards = page.locator('[data-testid="channel-card"]');
      const count = await channelCards.count();

      if (count > 0) {
        await channelCards.first().click();

        // チャンネル詳細ページに遷移
        await expect(page).toHaveURL(/\/channels\/.+/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('ナビゲーション', () => {
    test('ヘッダーからカテゴリーページにアクセスできる', async ({
      page,
    }) => {
      // デスクトップサイズに設定（デスクトップナビゲーションメニューを表示）
      await page.setViewportSize({ width: 1024, height: 768 });

      // トップページにアクセス（ネットワークがアイドル状態になるまで待つ）
      await page.goto('/', { waitUntil: 'networkidle' });

      // ヘッダーのカテゴリーリンクをクリック（デスクトップ表示）
      // デスクトップナビゲーションメニューから「カテゴリー」リンクを取得
      const categoryLink = page.getByRole('link', { name: 'カテゴリー' }).first();
      await categoryLink.waitFor({ state: 'visible', timeout: 5000 });

      // ナビゲーション完了を待ってからクリック
      await Promise.all([
        page.waitForURL('/categories', { timeout: 10000 }),
        categoryLink.click(),
      ]);

      // カテゴリー一覧ページの要素が表示されることを確認
      await expect(
        page.getByRole('heading', { name: 'カテゴリー一覧', level: 1 })
      ).toBeVisible();
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイル表示でカテゴリー一覧が正しく表示される', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/categories');

      // ページが表示される
      await expect(
        page.getByRole('heading', { name: 'カテゴリー一覧', level: 1 })
      ).toBeVisible();
    });

    test('タブレット表示でカテゴリー一覧が正しく表示される', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/categories');

      // ページが表示される
      await expect(
        page.getByRole('heading', { name: 'カテゴリー一覧', level: 1 })
      ).toBeVisible();
    });
  });

  test.describe('SEO', () => {
    test('カテゴリー一覧ページに適切なメタデータが設定されている', async ({
      page,
    }) => {
      await page.goto('/categories');

      // タイトルを確認
      await expect(page).toHaveTitle(/カテゴリー一覧/);
    });

    test('カテゴリー詳細ページに適切なメタデータが設定されている', async ({
      page,
    }) => {
      await page.goto('/categories/entertainment');

      // タイトルにカテゴリー名が含まれる
      await expect(page).toHaveTitle(/エンタメ/);
    });
  });
});
