import { MetadataRoute } from 'next';

/**
 * robots.txt生成
 *
 * 検索エンジンクローラーの巡回ルールを定義
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tube-review.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // APIエンドポイントは非公開
          '/profile/',       // プロフィールページは非公開
          '/my-channels/',   // マイチャンネルページは非公開
          '/_next/',         // Next.js内部ファイルは非公開
          '/admin/',         // 管理画面は非公開（将来用）
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],   // AI学習用クローラーは全て禁止
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],   // AI学習用クローラーは全て禁止
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
