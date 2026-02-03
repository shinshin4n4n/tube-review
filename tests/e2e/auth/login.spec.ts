import { test, expect } from '@playwright/test';

test.describe('ログイン画面', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');

    // タイトル確認
    await expect(page).toHaveTitle(/ログイン/);

    // メール入力フォーム確認
    const emailInput = page.getByPlaceholder('メールアドレス');
    await expect(emailInput).toBeVisible();

    // ログインボタン確認
    const loginButton = page.getByRole('button', { name: /ログインリンクを送信/ });
    await expect(loginButton).toBeVisible();
  });

  test('メールアドレスを入力してログインリンクを送信できる', async ({ page }) => {
    // Mock the Magic Link API to return success
    await page.route('**/api/auth/magic-link', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/login');

    // メールアドレス入力
    await page.getByPlaceholder('メールアドレス').fill('test@example.com');

    // ログインボタンクリック
    await page.getByRole('button', { name: /ログインリンクを送信/ }).click();

    // 成功メッセージ確認 - 要素の存在確認に変更
    const successMessage = page.getByTestId('success-message');
    await expect(successMessage).toHaveText('メールを確認してください。ログインリンクを送信しました。');
  });

  test('無効なメールアドレスでエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    // 無効なメールアドレス入力
    await page.getByPlaceholder('メールアドレス').fill('invalid-email');

    // ログインボタンクリック
    await page.getByRole('button', { name: /ログインリンクを送信/ }).click();

    // エラーメッセージ確認 - 要素の存在確認に変更
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toHaveText('有効なメールアドレスを入力してください');
  });
});
