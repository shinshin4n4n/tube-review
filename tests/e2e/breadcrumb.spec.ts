import { test, expect } from '@playwright/test';

/**
 * Breadcrumb Navigation Tests
 * ブレッドクラムナビゲーション機能のテスト
 */

test.describe('Breadcrumb Navigation', () => {
  test('検索ページでブレッドクラムが表示される', async ({ page }) => {
    await page.goto('/search');

    // ブレッドクラムが存在する
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 「トップ」リンクが存在する
    const topLink = breadcrumb.locator('a:has-text("トップ")');
    await expect(topLink).toBeVisible();
    await expect(topLink).toHaveAttribute('href', '/');

    // 「検索」が現在地として表示される
    await expect(breadcrumb.locator('text=検索')).toBeVisible();
  });

  test('ブレッドクラムからトップページに遷移できる', async ({ page }) => {
    await page.goto('/search');

    // トップリンクをクリック
    await page.click('nav[aria-label="breadcrumb"] a:has-text("トップ")');

    // トップページに遷移
    await expect(page).toHaveURL('/');
  });

  test('マイリストページでブレッドクラムが表示される', async ({ page }) => {
    await page.goto('/my-list');

    // 未認証の場合はログインページにリダイレクト
    if (page.url().includes('/login')) {
      return;
    }

    // ブレッドクラムが存在する
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 「トップ」リンクが存在する
    await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();

    // 「マイリスト」が現在地として表示される
    await expect(breadcrumb.locator('text=マイリスト')).toBeVisible();
  });

  test('マイリスト管理ページでブレッドクラムが表示される', async ({ page }) => {
    await page.goto('/my-lists');

    // 未認証の場合はログインページにリダイレクト
    if (page.url().includes('/login')) {
      return;
    }

    // ブレッドクラムが存在する
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 「トップ」リンクが存在する
    await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();

    // 「マイリスト管理」が現在地として表示される
    await expect(breadcrumb.locator('text=マイリスト管理')).toBeVisible();
  });

  test('プロフィールページでブレッドクラムが表示される', async ({ page }) => {
    await page.goto('/profile');

    // 未認証の場合はログインページにリダイレクト
    if (page.url().includes('/login')) {
      return;
    }

    // ブレッドクラムが存在する
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 「トップ」リンクが存在する
    await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();

    // 「プロフィール」が現在地として表示される
    await expect(breadcrumb.locator('text=プロフィール')).toBeVisible();
  });

  test('ブレッドクラムの構造が正しい（セマンティックHTML）', async ({ page }) => {
    await page.goto('/search');

    // nav要素が存在する
    const nav = page.locator('nav[aria-label="breadcrumb"]');
    await expect(nav).toBeVisible();

    // ol要素が存在する（順序付きリスト）
    const ol = nav.locator('ol');
    await expect(ol).toBeVisible();

    // li要素が複数存在する
    const items = ol.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThan(1);
  });

  test('モバイル表示でもブレッドクラムが見やすい', async ({ page }) => {
    // モバイルサイズに設定（iPhone SE）
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/search');

    // ブレッドクラムが表示される
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // リンクがクリック可能
    const topLink = breadcrumb.locator('a:has-text("トップ")');
    await expect(topLink).toBeVisible();
  });
});

test.describe('Breadcrumb with Channel Details', () => {
  test('チャンネル詳細ページでブレッドクラムが表示される', async ({ page }) => {
    // トップページから人気チャンネルを取得
    await page.goto('/');

    // 最初のチャンネルカードをクリック
    const firstChannel = page.locator('[data-testid="channel-card"]').first();

    // チャンネルカードが存在するか確認
    const channelCount = await page.locator('[data-testid="channel-card"]').count();
    if (channelCount === 0) {
      // チャンネルがない場合はテストをスキップ
      test.skip();
      return;
    }

    // チャンネル名を取得
    const channelName = await firstChannel.locator('h2').textContent();

    // チャンネル詳細ページに遷移
    await firstChannel.click();
    await page.waitForLoadState('networkidle');

    // ブレッドクラムが存在する
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // 「トップ」リンクが存在する
    await expect(breadcrumb.locator('a:has-text("トップ")')).toBeVisible();

    // チャンネル名が現在地として表示される
    if (channelName) {
      await expect(breadcrumb.locator(`text=${channelName}`)).toBeVisible();
    }
  });

  test('構造化データが正しく出力される', async ({ page }) => {
    // トップページから人気チャンネルを取得
    await page.goto('/');

    // 最初のチャンネルカードをクリック
    const firstChannel = page.locator('[data-testid="channel-card"]').first();

    // チャンネルカードが存在するか確認
    const channelCount = await page.locator('[data-testid="channel-card"]').count();
    if (channelCount === 0) {
      // チャンネルがない場合はテストをスキップ
      test.skip();
      return;
    }

    await firstChannel.click();
    await page.waitForLoadState('networkidle');

    // JSON-LDスクリプトが存在する
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeVisible();

    // スクリプトの内容を取得
    const jsonLdContent = await jsonLdScript.textContent();

    if (jsonLdContent) {
      const structuredData = JSON.parse(jsonLdContent);

      // BreadcrumbList型であることを確認
      expect(structuredData['@type']).toBe('BreadcrumbList');

      // itemListElementが存在することを確認
      expect(structuredData.itemListElement).toBeDefined();
      expect(Array.isArray(structuredData.itemListElement)).toBe(true);
      expect(structuredData.itemListElement.length).toBeGreaterThan(0);

      // 最初の要素が「トップ」であることを確認
      expect(structuredData.itemListElement[0].name).toBe('トップ');
      expect(structuredData.itemListElement[0].position).toBe(1);
    }
  });
});
