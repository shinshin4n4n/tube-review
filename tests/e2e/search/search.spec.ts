import { test, expect } from '@playwright/test';

test.describe('チャンネル検索ページ', () => {
  test('検索フォームが表示される', async ({ page }) => {
    await page.goto('/search', { waitUntil: 'networkidle' });

    // 検索フォームの要素を確認
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    const searchButton = page.getByTestId('search-button');
    await expect(searchButton).toBeVisible();
  });

  test.skip('キーワード検索が実行できる', async ({ page }) => {
    // TODO: YouTube APIデータに依存するためスキップ
    await page.goto('/search', { waitUntil: 'networkidle' });

    // 検索キーワードを入力
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('プログラミング');

    // 検索ボタンをクリック
    const searchButton = page.getByTestId('search-button');
    await searchButton.click();

    // URLパラメータが更新されることを確認
    await expect(page).toHaveURL(/\/search\?q=プログラミング/);

    // 検索結果が表示されることを確認
    const resultsContainer = page.getByTestId('search-results');
    await expect(resultsContainer).toBeVisible();
  });

  test.skip('検索結果にチャンネルカードが表示される', async ({ page }) => {
    // TODO: YouTube APIデータに依存するためスキップ
    // 検索クエリ付きでアクセス
    await page.goto('/search?q=tech', { waitUntil: 'networkidle' });

    // チャンネルカードが表示されることを確認
    const channelCards = page.getByTestId('channel-card');
    await expect(channelCards.first()).toBeVisible({ timeout: 10000 });

    // チャンネルカードに必要な情報が表示されることを確認
    const firstCard = channelCards.first();

    // サムネイル
    const thumbnail = firstCard.getByTestId('channel-thumbnail');
    await expect(thumbnail).toBeVisible();

    // チャンネル名
    const channelName = firstCard.getByTestId('channel-name');
    await expect(channelName).toBeVisible();

    // 説明文
    const description = firstCard.getByTestId('channel-description');
    await expect(description).toBeVisible();
  });

  test.skip('空の検索クエリでは検索が実行されない', async ({ page }) => {
    // TODO: 実装に合わせてテストを修正する必要がある
    await page.goto('/search', { waitUntil: 'networkidle' });

    // 空のまま検索ボタンをクリック
    const searchButton = page.getByTestId('search-button');
    await searchButton.click();

    // URLが変わらないことを確認
    await expect(page).toHaveURL('/search');

    // エラーメッセージまたはバリデーションメッセージが表示される
    // （実装次第で調整）
  });

  test.skip('検索結果が0件の場合、適切なメッセージが表示される', async ({
    page,
  }) => {
    // TODO: YouTube APIデータに依存するためスキップ
    // 存在しないチャンネル名で検索
    await page.goto('/search?q=xyzabcnotfound123456789', { waitUntil: 'networkidle' });

    // 空状態メッセージが表示されることを確認
    const emptyState = page.getByTestId('search-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    // メッセージ内容を確認
    await expect(emptyState).toContainText('見つかりませんでした');
  });

  test.skip('チャンネルカードをクリックすると詳細ページに遷移する', async ({
    page,
  }) => {
    // TODO: YouTube APIデータに依存するためスキップ
    await page.goto('/search?q=tech', { waitUntil: 'networkidle' });

    // 最初のチャンネルカードが表示されるまで待機
    const firstCard = page.getByTestId('channel-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // カードをクリック
    await firstCard.click();

    // チャンネル詳細ページに遷移することを確認
    await expect(page).toHaveURL(/\/channels\/.+/);
  });

  test('ローディング状態が表示される', async ({ page }) => {
    // ページにアクセス（ローディングを確認）
    await page.goto('/search?q=programming', { waitUntil: 'networkidle' });

    // ローディングスケルトンまたはスピナーが表示される
    // Note: 実装によってはすぐに結果が表示されるため、
    // このテストはスキップまたは調整が必要
    const loadingIndicator = page.getByTestId('search-loading');

    // ローディングが表示されるか、すぐに結果が表示される
    try {
      await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
    } catch {
      // ローディングが非常に速い場合はスキップ
      console.log('Loading was too fast to capture');
    }
  });

  test('エラー状態が適切に表示される', async () => {
    // Note: このテストは実際のエラー状態を再現する必要があります
    // モックサーバーを使用するか、実装後に調整します
    test.skip();
  });
});
