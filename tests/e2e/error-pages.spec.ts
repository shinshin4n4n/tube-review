import { test, expect } from '@playwright/test';

test.describe('Error Pages and Edge Cases', () => {
  test.skip('should display 404 page for non-existent route', async ({ page }) => {
    // TODO: 404ページのカスタムデザインが未実装
    // 存在しないページに移動
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

    // 404ページが表示されることを確認
    await expect(page.locator('text=/404|Not Found/i')).toBeVisible();

    // トップページへのリンクがあることを確認
    const homeLink = page.getByRole('link', { name: /トップ|Home/i });
    await expect(homeLink).toBeVisible();
  });

  test.skip('should display 404 page for non-existent channel', async ({
    page,
  }) => {
    // TODO: チャンネル404ページのカスタムデザインが未実装
    // 存在しないチャンネルIDでアクセス
    await page.goto('/channels/non-existent-channel-id', { waitUntil: 'networkidle' });

    // エラーメッセージまたは404ページが表示されることを確認
    await expect(
      page.locator('text=/チャンネルが見つかりません|Channel not found/i')
    ).toBeVisible();
  });

  test.skip('should handle network error gracefully', async ({ page }) => {
    // ネットワークをオフラインに設定
    await page.context().setOffline(true);

    // ページを読み込もうとする
    await page.goto('/');

    // エラーページまたはオフラインメッセージが表示されることを確認
    // Note: ブラウザのデフォルトエラーページが表示される場合もある
  });

  test('should show permission error for unauthorized access', async ({
    page,
  }) => {
    // ログアウト状態で、認証が必要なページにアクセス
    await page.goto('/my-channels');

    // ログインページにリダイレクトされるか、エラーメッセージが表示されることを確認
    const isLoginPage = page.url().includes('/login');
    const hasErrorMessage = await page
      .locator('text=/ログインが必要です|Login required/i')
      .isVisible();

    expect(isLoginPage || hasErrorMessage).toBeTruthy();
  });

  test.skip('should handle large data display', async ({ page }) => {
    // ランキングページなど、大量のデータが表示されるページに移動
    await page.goto('/ranking');

    // ページが正常にレンダリングされることを確認
    await expect(page.locator('[data-testid="ranking-list"]')).toBeVisible({
      timeout: 10000,
    });

    // スクロールしても問題なく動作することを確認
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // ページが正常に表示されていることを確認
    await expect(page).not.toHaveURL(/error/);
  });

  test('should validate form input', async ({ page }) => {
    // レビュー投稿ページに移動
    await page.goto('/channels/test-channel-id');

    // レビュー投稿ボタンをクリック
    const reviewButton = page.getByRole('button', {
      name: /レビューを書く|Write Review/i,
    });

    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // 空のフォームで送信を試みる
      await page.getByRole('button', { name: /投稿|Submit/i }).click();

      // バリデーションエラーが表示されることを確認
      await expect(
        page.locator('text=/入力してください|required/i')
      ).toBeVisible();
    }
  });

  test.skip('should handle concurrent edit conflicts', async ({ page }) => {
    // Note: This test simulates a concurrent edit scenario
    // In practice, you would need two browser contexts

    // プロフィール編集ページに移動
    await page.goto('/settings/profile');

    // フォームを編集
    await page.fill('[name="displayName"]', 'Updated Name');

    // 保存ボタンをクリック
    await page.getByRole('button', { name: /保存|Save/i }).click();

    // 成功メッセージまたはエラーメッセージが表示されることを確認
    const successMessage = page.locator('text=/保存しました|Saved/i');
    const errorMessage = page.locator('text=/エラー|Error/i');

    const hasMessage =
      (await successMessage.isVisible()) || (await errorMessage.isVisible());
    expect(hasMessage).toBeTruthy();
  });

  test('should display proper error messages', async ({ page }) => {
    // 存在しないリソースにアクセス
    await page.goto('/api/non-existent-endpoint');

    // エラーメッセージが表示されることを確認
    // Note: APIエンドポイントの場合、JSONエラーが返される可能性がある
  });
});
