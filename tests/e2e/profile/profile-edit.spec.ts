import { test, expect } from '@playwright/test';

test.describe('プロフィール編集ページ', () => {
  test('Select コンポーネントでエラーが発生しない', async ({ page }) => {
    // コンソールエラーを収集
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // ページエラーを収集
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // プロフィール編集ページにアクセス
    await page.goto('/settings/profile');

    // ログインページにリダイレクトされる場合があるため、URLをチェック
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // 認証が必要なため、このテストはスキップ
      test.skip();
      return;
    }

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 性別セレクトボックスを探す
    const genderSelect = page.locator('#gender');
    if (await genderSelect.isVisible()) {
      // セレクトボックスをクリック
      await genderSelect.click();

      // ドロップダウンが開くまで待機
      await page.waitForTimeout(500);

      // "選択しない" オプションが表示されることを確認
      const unspecifiedOption = page.getByText('選択しない').first();
      await expect(unspecifiedOption).toBeVisible();
    }

    // 都道府県セレクトボックスを探す
    const prefectureSelect = page.locator('#prefecture');
    if (await prefectureSelect.isVisible()) {
      // セレクトボックスをクリック
      await prefectureSelect.click();

      // ドロップダウンが開くまで待機
      await page.waitForTimeout(500);

      // "選択しない" オプションが表示されることを確認
      const unspecifiedOption = page.getByText('選択しない').nth(1);
      await expect(unspecifiedOption).toBeVisible();
    }

    // コンソールエラーがないことを確認
    // Select.Item の value が空文字列に関するエラーがないことを確認
    const selectItemErrors = consoleErrors.filter((error) =>
      error.includes('Select.Item') && error.includes('empty string')
    );
    expect(selectItemErrors.length).toBe(0);

    // ページエラーがないことを確認
    expect(pageErrors.length).toBe(0);
  });
});
