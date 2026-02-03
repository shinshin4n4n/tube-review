import { test, expect } from '@playwright/test';

test.describe('プロフィールページ', () => {
  test('未認証時はログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/profile');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/login/);
  });

  test('認証済みユーザーはプロフィール情報を閲覧できる', async ({
    page,
    context,
  }) => {
    // テスト用のセッションクッキーを設定
    // Note: 実際のE2Eテストではログインフローを経由するか、
    // テスト用のセッションを作成する必要があります
    await context.addCookies([
      {
        name: 'sb-test-auth-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/profile');

    // プロフィールページのタイトル確認
    await expect(page).toHaveTitle(/プロフィール/);

    // プロフィール情報が表示されることを確認
    const profileCard = page.getByTestId('profile-card');
    await expect(profileCard).toBeVisible();

    // アバター画像が表示されることを確認
    const avatar = page.getByTestId('profile-avatar');
    await expect(avatar).toBeVisible();

    // メールアドレスが表示されることを確認
    const email = page.getByTestId('profile-email');
    await expect(email).toBeVisible();

    // 登録日が表示されることを確認
    const createdAt = page.getByTestId('profile-created-at');
    await expect(createdAt).toBeVisible();
  });

  test('プロフィールページに必要な情報が全て表示される', async ({
    page,
  }) => {
    // Note: このテストは実際の認証フローを経由する必要があります
    // ここではスキップして、後で統合テストで実装します
    test.skip();

    await page.goto('/profile');

    // 表示名確認
    const displayName = page.getByTestId('profile-display-name');
    await expect(displayName).toBeVisible();

    // ユーザー名確認
    const username = page.getByTestId('profile-username');
    await expect(username).toBeVisible();

    // メールアドレス確認
    const email = page.getByTestId('profile-email');
    await expect(email).toBeVisible();

    // 登録日確認
    const createdAt = page.getByTestId('profile-created-at');
    await expect(createdAt).toBeVisible();
  });
});
