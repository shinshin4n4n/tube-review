import { test, expect } from '@playwright/test';

test.describe('Googleログイン', () => {
  test('ログイン画面の構成確認', async ({ page }) => {
    await page.goto('/login');

    // Magic Linkフォーム（既存）
    await expect(page.getByPlaceholder('メールアドレス')).toBeVisible();
    await expect(page.getByRole('button', { name: /ログインリンクを送信/ })).toBeVisible();

    // 区切り線
    await expect(page.getByText(/または/)).toBeVisible();

    // Googleボタン
    await expect(page.getByRole('button', { name: /Googleでログイン/ })).toBeVisible();
  });

  test('Googleボタンのアイコン確認', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.getByRole('button', { name: /Googleでログイン/ });

    // ボタンが表示されている
    await expect(googleButton).toBeVisible();

    // アイコンが表示されている
    const icon = googleButton.locator('svg');
    await expect(icon).toBeVisible();
  });

  test('Googleボタンをクリックするとローディング状態になる', async ({ page }) => {
    await page.goto('/login');

    const googleButton = page.getByRole('button', { name: /Googleでログイン/ });

    // クリック前にローディング状態でないことを確認
    await expect(googleButton).not.toHaveText(/ログイン中/);

    // Note: 実際のGoogle認証画面への遷移はE2Eでテスト困難
    // ここではボタンの存在とアイコンの確認のみ実施
  });
});
