import { test, expect } from '@playwright/test';

test.describe('Review Submission', () => {
  test.beforeEach(async () => {
    // Note: This test requires a logged-in user
    // In a real scenario, you would need to implement login flow or use stored auth state
  });

  test('should display review form for authenticated users', async ({ page }) => {
    // Navigate to a channel detail page
    // Note: Replace with actual channel ID from your test data
    await page.goto('/channels/UC_test_channel_id');

    // Check if review form is visible
    await expect(page.getByText('レビューを投稿')).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: '評価' })).toBeVisible();
  });

  test('should validate review form inputs', async ({ page }) => {
    await page.goto('/channels/UC_test_channel_id');

    // Try to submit without rating
    const submitButton = page.getByRole('button', { name: 'レビューを投稿' });
    await expect(submitButton).toBeDisabled();

    // Select rating
    const stars = page.getByRole('radio', { name: '5つ星' });
    await stars.click();

    // Try to submit without content (should still be disabled)
    await expect(submitButton).toBeDisabled();

    // Add content less than 50 characters
    const contentTextarea = page.getByRole('textbox', { name: /レビュー本文/ });
    await contentTextarea.fill('Short content');

    // Submit button should still be disabled
    await expect(submitButton).toBeDisabled();

    // Add content with at least 50 characters
    await contentTextarea.fill(
      'This is a detailed review with at least fifty characters to meet the minimum requirement.'
    );

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should submit review successfully', async ({ page }) => {
    await page.goto('/channels/UC_test_channel_id');

    // Fill in the review form
    const ratingButton = page.getByRole('radio', { name: '5つ星' });
    await ratingButton.click();

    const titleInput = page.getByLabelText('タイトル（オプション）');
    await titleInput.fill('Great channel!');

    const contentTextarea = page.getByLabelText(/レビュー本文/);
    await contentTextarea.fill(
      'This is a great channel with amazing content. I highly recommend it to everyone interested in the topic. The host is knowledgeable and engaging.'
    );

    // Submit the form
    const submitButton = page.getByRole('button', { name: 'レビューを投稿' });
    await submitButton.click();

    // Wait for success toast
    await expect(page.getByText('レビューを投稿しました')).toBeVisible();

    // Form should be reset
    await expect(titleInput).toHaveValue('');
    await expect(contentTextarea).toHaveValue('');
  });

  test('should show error for duplicate review', async ({ page }) => {
    // This test assumes the user has already submitted a review for this channel
    await page.goto('/channels/UC_test_channel_id');

    // Fill in the review form
    await page.getByRole('radio', { name: '5つ星' }).click();
    await page
      .getByLabelText(/レビュー本文/)
      .fill(
        'This is another review attempt to test duplicate detection with enough characters.'
      );

    // Submit the form
    await page.getByRole('button', { name: 'レビューを投稿' }).click();

    // Wait for error toast
    await expect(
      page.getByText('このチャンネルにはすでにレビューを投稿しています')
    ).toBeVisible();
  });

  test('should show character count feedback', async ({ page }) => {
    await page.goto('/channels/UC_test_channel_id');

    const contentTextarea = page.getByLabelText(/レビュー本文/);

    // Check initial character count
    await expect(page.getByText('0 / 2000文字')).toBeVisible();

    // Type some content
    await contentTextarea.fill('Short');

    // Check updated character count with "あとX文字必要" message
    await expect(page.getByText(/あと45文字必要/)).toBeVisible();

    // Fill with 50+ characters
    await contentTextarea.fill(
      'This is a detailed review with at least fifty characters.'
    );

    // Error message should disappear
    await expect(page.getByText(/あと.*文字必要/)).not.toBeVisible();
  });
});
