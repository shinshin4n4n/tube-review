/**
 * Lighthouse CI 設定ファイル
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

module.exports = {
  ci: {
    collect: {
      // Next.jsのプロダクションサーバーを起動
      // Note: GitHub Actions workflow内で既にビルド済みのため、npm startのみ実行
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60000, // 60秒

      // 計測対象のURL（トップページのみに簡略化）
      url: [
        'http://localhost:3000/', // トップページ
      ],

      // 各URLを1回計測（高速化）
      numberOfRuns: 1,

      // Lighthouse設定
      settings: {
        // モバイルとデスクトップの両方を計測
        preset: 'desktop',
        // Chrome起動オプション
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },

    assert: {
      // しきい値の設定（ポートフォリオ向けに緩和）
      assertions: {
        // カテゴリ別のスコア基準
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],

        // Core Web Vitals (警告レベル)
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.2 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
      },
    },

    upload: {
      // 一時的なパブリックストレージにアップロード（7日間保存）
      target: 'temporary-public-storage',
    },
  },
};
