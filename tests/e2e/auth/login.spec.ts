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
    await page.goto('/login');

    // メールアドレス入力
    await page.getByPlaceholder('メールアドレス').fill('test@example.com');

    // ログインボタンクリック
    await page.getByRole('button', { name: /ログインリンクを送信/ }).click();

    // 成功メッセージ確認
    await expect(page.getByText(/メールを確認してください/)).toBeVisible();
  });

  test('無効なメールアドレスでエラーが表示される', async ({ page }) => {
    await page.goto('/login');

    // 無効なメールアドレス入力
    await page.getByPlaceholder('メールアドレス').fill('invalid-email');

    // ログインボタンクリック
    await page.getByRole('button', { name: /ログインリンクを送信/ }).click();

    // エラーメッセージ確認
    await expect(page.getByText(/有効なメールアドレスを入力してください/)).toBeVisible();
  });
});
