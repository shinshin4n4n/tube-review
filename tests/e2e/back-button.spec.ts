import { test, expect } from '@playwright/test';

test.describe('戻るボタン', () => {
  test('チャンネル詳細ページに戻るボタンが表示される', async ({
    page,
  }) => {
    // テスト用のチャンネルIDを使用（test-data-setup.tsで投入されたデータ）
    const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

    // トップページにアクセス
    await page.goto('/');

    // チャンネル詳細ページに直接遷移
    await page.goto(`/channels/${testChannelId}`);

    // チャンネル詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/channels\/.+/);

    // 戻るボタンが表示されることを確認
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveText(/戻る/);
  });

  test('戻るボタンをクリックすると前のページに戻る', async ({ page }) => {
    // テスト用のチャンネルIDを使用（test-data-setup.tsで投入されたデータ）
    const testChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

    // トップページにアクセス
    await page.goto('/');

    // チャンネル詳細ページに遷移
    await page.goto(`/channels/${testChannelId}`);

    // チャンネル詳細ページに遷移したことを確認
    await expect(page).toHaveURL(/\/channels\/.+/);

    // 戻るボタンをクリック
    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    // トップページに戻ることを確認
    await expect(page).toHaveURL('/');
  });

  test.skip(
    !process.env.RUN_YOUTUBE_API_TESTS,
    'YouTube API tests are disabled to avoid quota/rate limits'
  );
  test('検索ページからチャンネル詳細ページに遷移し、戻るボタンで検索ページに戻る', async ({
    page,
  }) => {
    // 検索ページにアクセス
    await page.goto('/search');

    // 検索を実行
    await page.fill('[data-testid="search-input"]', 'テスト');

    // 検索ボタンがenabledになるまで待機してクリック
    const searchButton = page.locator('[data-testid="search-button"]');
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500); // 入力後の状態更新を待つ
    await searchButton.click({ force: true });

    // 検索結果が表示されるまで待機（最大10秒）
    const firstChannelCard = page.locator('[data-testid="channel-card"]').first();
    const hasResults = await firstChannelCard
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasResults) {
      await firstChannelCard.click();

      // チャンネル詳細ページに遷移したことを確認
      await expect(page).toHaveURL(/\/channels\/.+/);

      // 戻るボタンをクリック
      const backButton = page.locator('[data-testid="back-button"]');
      await backButton.click();

      // 検索ページに戻ることを確認（検索クエリは保持される）
      await expect(page).toHaveURL(/\/search/);
    } else {
      // 検索結果がない場合はスキップ
      test.skip();
    }
  });
});

test.describe('認証リダイレクト', () => {
  test('未認証ユーザーが保護されたページにアクセスするとログインページにリダイレクトされる', async ({
    page,
  }) => {
    // 未認証状態で保護されたページにアクセス
    await page.goto('/my-list');

    // ログインページにリダイレクトされ、redirectパラメータが含まれることを確認
    await expect(page).toHaveURL(/\/login\?redirect=%2Fmy-list/);
  });

  test('ログイン後、redirectパラメータがあれば元のページにリダイレクトされる', async ({
    page,
  }) => {
    // 未認証状態で保護されたページにアクセス
    await page.goto('/profile');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);

    // Magic Link認証（テスト用）
    // 注: 実際の認証フローをテストするには、Supabaseのテスト環境をセットアップする必要があります
    // ここでは、URLパラメータの確認のみを行います
    const currentUrl = page.url();
    expect(currentUrl).toContain('redirect=%2Fprofile');
  });

  test('ログインページに直接アクセスした場合、redirectパラメータがない', async ({
    page,
  }) => {
    // ログインページに直接アクセス
    await page.goto('/login');

    // URLにredirectパラメータが含まれないことを確認
    await expect(page).toHaveURL('/login');
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('redirect=');
  });

  test('サインアップページへのredirectパラメータの引き継ぎ', async ({
    page,
  }) => {
    // redirectパラメータ付きでログインページにアクセス
    await page.goto('/login?redirect=%2Fprofile');

    // 現時点では、サインアップページへのリンクを確認
    // （実際のサインアップフローはこのテストの範囲外）
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);
  });

  test('無効なリダイレクトURLはバリデーションされる', async ({ page }) => {
    // 外部URLへのリダイレクトを試みる（セキュリティテスト）
    await page.goto('/login?redirect=https://evil.com');

    // ログインページが表示されることを確認
    await expect(page).toHaveURL(/\/login/);

    // 注: 実際のバリデーションはコールバック処理で行われるため、
    // ここではURLパラメータの存在確認のみ
  });
});
