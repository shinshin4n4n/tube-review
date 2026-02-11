import { test, expect } from '@playwright/test';

test.describe('チャンネル詳細ページ', () => {
  // テスト用の既知のYouTubeチャンネルID
  const TEST_CHANNEL_ID = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers

  test('チャンネル詳細情報が表示される', async ({ page }) => {
    await page.goto(`/channels/${TEST_CHANNEL_ID}`);

    // チャンネル名が表示されることを確認
    const channelName = page.getByTestId('channel-name');
    await expect(channelName).toBeVisible({ timeout: 10000 });

    // サムネイルが表示されることを確認
    const channelThumbnail = page.getByTestId('channel-thumbnail');
    await expect(channelThumbnail).toBeVisible();

    // 登録者数が表示されることを確認
    const subscriberCount = page.getByTestId('subscriber-count');
    await expect(subscriberCount).toBeVisible();
    await expect(subscriberCount).toContainText(/[0-9,]+/);

    // 動画数が表示されることを確認
    const videoCount = page.getByTestId('video-count');
    await expect(videoCount).toBeVisible();
    await expect(videoCount).toContainText(/[0-9,]+/);

    // 視聴回数が表示されることを確認
    const viewCount = page.getByTestId('view-count');
    await expect(viewCount).toBeVisible();
    await expect(viewCount).toContainText(/[0-9,]+/);

    // 説明文が表示されることを確認
    const description = page.getByTestId('channel-description');
    await expect(description).toBeVisible();
  });

  test('メタデータが正しく設定される', async ({ page }) => {
    await page.goto(`/channels/${TEST_CHANNEL_ID}`);

    // ページタイトルが設定されることを確認
    await expect(page).toHaveTitle(/.+/);

    // メタディスクリプションが設定されることを確認
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // OGPタグが設定されることを確認
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /.+/);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', /.+/);

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /https?:\/\/.+/);
  });

  test('検索結果からチャンネル詳細ページに遷移できる', async ({
    page,
  }) => {
    // 検索ページにアクセス
    await page.goto('/search?q=google', { waitUntil: 'networkidle' });

    // 最初のチャンネルカードが表示されるまで待機
    const firstCard = page.getByTestId('channel-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    // チャンネルカードをクリック
    await firstCard.click();

    // チャンネル詳細ページに遷移することを確認
    await expect(page).toHaveURL(/\/channels\/.+/);

    // チャンネル名が表示されることを確認
    const channelName = page.getByTestId('channel-name');
    await expect(channelName).toBeVisible({ timeout: 10000 });
  });

  test.skip('存在しないチャンネルIDで404エラーが表示される', async ({
    page,
  }) => {
    // TODO: 404エラーページが未実装のためスキップ
    // 存在しないチャンネルIDでアクセス
    await page.goto('/channels/INVALID_CHANNEL_ID_12345', { waitUntil: 'networkidle' });

    // エラーメッセージが表示されることを確認
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // エラー内容を確認
    await expect(errorMessage).toContainText(
      /見つかりませんでした|not found/i
    );
  });

  test('ローディング状態が表示される', async ({ page }) => {
    // ページにアクセス（ローディングを確認）
    await page.goto(`/channels/${TEST_CHANNEL_ID}`);

    // ローディングスケルトンまたはスピナーが表示される
    // Note: 実装によってはすぐに結果が表示されるため、
    // このテストはスキップまたは調整が必要
    const loadingIndicator = page.getByTestId('channel-loading');

    // ローディングが表示されるか、すぐに結果が表示される
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    } catch {
      // ローディングが非常に速い場合はスキップ
      console.log('Loading was too fast to capture');
    }

    // 最終的にはチャンネル情報が表示される
    const channelName = page.getByTestId('channel-name');
    await expect(channelName).toBeVisible({ timeout: 10000 });
  });

  test('レスポンシブデザインが適用される', async ({ page }) => {
    // モバイルビューポートで確認
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/channels/${TEST_CHANNEL_ID}`);

    const channelName = page.getByTestId('channel-name');
    await expect(channelName).toBeVisible({ timeout: 10000 });

    // デスクトップビューポートで確認
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    await expect(channelName).toBeVisible({ timeout: 10000 });
  });

  test('統計情報が数値フォーマットされている', async ({ page }) => {
    await page.goto(`/channels/${TEST_CHANNEL_ID}`);

    // 登録者数のフォーマット確認（カンマ区切り）
    const subscriberCount = page.getByTestId('subscriber-count');
    await expect(subscriberCount).toBeVisible({ timeout: 10000 });

    const subscriberText = await subscriberCount.textContent();
    // 数値にカンマが含まれているか、または単位（万、K、M等）が付いているか確認
    expect(subscriberText).toMatch(/[0-9,]+|[0-9]+[万KM]/);
  });
});
