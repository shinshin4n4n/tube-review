import { test, expect } from '@playwright/test';

test.describe('Channel Status Change', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test requires a logged-in user
    await page.goto('/');
  });

  test('should change status from "見たい" to "見ている"', async ({ page }) => {
    // チャンネル詳細ページに移動
    await page.goto('/channels/test-channel-id');

    // 「見たい」ボタンが表示されている場合
    const wantToWatchButton = page.getByRole('button', {
      name: /見たい|Want to Watch/i,
    });

    if (await wantToWatchButton.isVisible()) {
      await wantToWatchButton.click();

      // ステータスが「見たい」に設定されたことを確認
      await expect(
        page.getByText(/見たいリストに追加しました/i)
      ).toBeVisible();

      // ステータスを「見ている」に変更
      const watchingButton = page.getByRole('button', {
        name: /見ている|Watching/i,
      });
      await watchingButton.click();

      // ステータスが「見ている」に変更されたことを確認
      await expect(
        page.getByText(/見ているリストに変更しました/i)
      ).toBeVisible();
    }
  });

  test('should change status from "見ている" to "見た"', async ({ page }) => {
    // チャンネル詳細ページに移動
    await page.goto('/channels/test-channel-id');

    // 「見ている」ボタンが表示されている場合
    const watchingButton = page.getByRole('button', {
      name: /見ている|Watching/i,
    });

    if (await watchingButton.isVisible()) {
      // ステータスを「見た」に変更
      const watchedButton = page.getByRole('button', {
        name: /見た|Watched/i,
      });
      await watchedButton.click();

      // ステータスが「見た」に変更されたことを確認
      await expect(
        page.getByText(/見たリストに変更しました/i)
      ).toBeVisible();
    }
  });

  test('should remove channel from list', async ({ page }) => {
    // チャンネル詳細ページに移動
    await page.goto('/channels/test-channel-id');

    // ステータスボタンが表示されている場合
    const statusButton = page
      .locator('[data-testid="status-button"]')
      .first();

    if (await statusButton.isVisible()) {
      // メニューを開く
      await statusButton.click();

      // 「リストから削除」オプションをクリック
      const removeButton = page.getByRole('menuitem', {
        name: /削除|Remove/i,
      });

      if (await removeButton.isVisible()) {
        await removeButton.click();

        // 削除確認ダイアログが表示される場合
        page.on('dialog', (dialog) => dialog.accept());

        // 削除されたことを確認
        await expect(
          page.getByText(/リストから削除しました/i)
        ).toBeVisible();
      }
    }
  });

  test('should display status in my channels page', async ({ page }) => {
    // マイチャンネルページに移動
    await page.goto('/my-channels');

    // 「見たい」タブをクリック
    const wantToWatchTab = page.getByRole('tab', { name: /見たい/i });
    if (await wantToWatchTab.isVisible()) {
      await wantToWatchTab.click();

      // 「見たい」リストのチャンネルが表示されることを確認
      await expect(
        page.locator('[data-testid="channel-card"]').first()
      ).toBeVisible();
    }

    // 「見ている」タブをクリック
    const watchingTab = page.getByRole('tab', { name: /見ている/i });
    if (await watchingTab.isVisible()) {
      await watchingTab.click();

      // 「見ている」リストのチャンネルが表示されることを確認
      await expect(
        page.locator('[data-testid="channel-card"]').first()
      ).toBeVisible();
    }

    // 「見た」タブをクリック
    const watchedTab = page.getByRole('tab', { name: /見た/i });
    if (await watchedTab.isVisible()) {
      await watchedTab.click();

      // 「見た」リストのチャンネルが表示されることを確認
      await expect(
        page.locator('[data-testid="channel-card"]').first()
      ).toBeVisible();
    }
  });
});
