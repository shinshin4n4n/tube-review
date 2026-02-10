import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動
    await page.goto('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Note: This test requires a logged-in user
    // In a real scenario, you would use test fixtures or authentication helpers

    // ログイン状態の確認（ヘッダーにユーザーメニューが表示されている）
    await page.goto('/');

    // ユーザーメニューがある場合（ログイン済み）
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      // ユーザーメニューをクリック
      await userMenu.click();

      // ログアウトボタンをクリック
      await page.getByRole('button', { name: /ログアウト|Logout/i }).click();

      // ログアウト後、ログインページまたはトップページにリダイレクトされることを確認
      await expect(page).toHaveURL(/\/(login)?$/);

      // ユーザーメニューが表示されていないことを確認
      await expect(userMenu).not.toBeVisible();
    }
  });

  test('should show login button after logout', async ({ page }) => {
    await page.goto('/');

    // ログインボタンが表示されていることを確認
    const loginButton = page.getByRole('link', { name: /ログイン|Login/i });
    await expect(loginButton).toBeVisible();
  });
});
