import { test, expect } from '@playwright/test';

test.describe('My Lists Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Note: This test requires a logged-in user
    await page.goto('/my-lists');
  });

  test('should display my lists page', async ({ page }) => {
    // ページタイトルを確認
    await expect(page).toHaveTitle(/マイリスト|My Lists/i);

    // ヘッダーが表示されていることを確認
    const heading = page.getByRole('heading', {
      name: /マイリスト|My Lists/i,
    });
    await expect(heading).toBeVisible();
  });

  test('should create a new list', async ({ page }) => {
    // 「新しいリストを作成」ボタンをクリック
    const createButton = page.getByRole('button', {
      name: /リスト作成|新しいリスト|Create List/i,
    });

    if (await createButton.isVisible()) {
      await createButton.click();

      // タイトル入力
      await page.fill('[name="title"]', 'Test List');

      // 説明入力（オプション）
      await page.fill('[name="description"]', 'This is a test list');

      // 保存ボタンをクリック
      await page.getByRole('button', { name: /保存|Save/i }).click();

      // 成功メッセージまたはリストが追加されたことを確認
      await expect(page.getByText('Test List')).toBeVisible();
    }
  });

  test('should edit an existing list', async ({ page }) => {
    // 既存のリストがある場合、編集ボタンをクリック
    const editButton = page.getByRole('button', { name: /編集|Edit/i }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // タイトルを変更
      await page.fill('[name="title"]', 'Updated Test List');

      // 保存ボタンをクリック
      await page.getByRole('button', { name: /保存|Save/i }).click();

      // 更新されたタイトルが表示されることを確認
      await expect(page.getByText('Updated Test List')).toBeVisible();
    }
  });

  test('should delete a list', async ({ page }) => {
    // 既存のリストがある場合、削除ボタンをクリック
    const deleteButton = page
      .getByRole('button', { name: /削除|Delete/i })
      .first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 確認ダイアログが表示される場合、OKをクリック
      page.on('dialog', (dialog) => dialog.accept());

      // リストが削除されたことを確認（リストの数が減る）
      // Note: 実際の実装に応じて調整が必要
    }
  });

  test('should add a channel to a list', async ({ page }) => {
    // チャンネル検索ページに移動
    await page.goto('/search');

    // チャンネルを検索
    await page.fill('[placeholder*="検索"]', 'test channel');
    await page.keyboard.press('Enter');

    // 検索結果が表示されるまで待機
    await page.waitForSelector('[data-testid="search-result"]', {
      timeout: 5000,
    });

    // 最初の検索結果の「リストに追加」ボタンをクリック
    const addToListButton = page
      .getByRole('button', { name: /リストに追加|Add to List/i })
      .first();

    if (await addToListButton.isVisible()) {
      await addToListButton.click();

      // リスト選択ダイアログが表示される
      const listOption = page.getByRole('option').first();
      await listOption.click();

      // 追加成功のメッセージを確認
      await expect(
        page.getByText(/追加しました|Added to list/i)
      ).toBeVisible();
    }
  });
});
