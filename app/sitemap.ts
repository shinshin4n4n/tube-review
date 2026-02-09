import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * サイトマップ生成
 *
 * 検索エンジンにサイト構造を伝えるためのsitemap.xmlを動的生成
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tube-review.vercel.app';

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 動的ページ（チャンネル）
  let channelPages: MetadataRoute.Sitemap = [];

  try {
    // ビルド時は認証不要のデータのみアクセス（cookiesを使わない）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 公開されているチャンネル一覧を取得（最大1000件）
    const { data: channels } = await supabase
      .from('channels')
      .select('id, updated_at')
      .order('subscriber_count', { ascending: false })
      .limit(1000);

    if (channels) {
      channelPages = channels.map((channel) => ({
        url: `${siteUrl}/channels/${channel.id}`,
        lastModified: new Date(channel.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to generate sitemap for channels:', error);
    // エラーが発生しても静的ページは返す
  }

  return [...staticPages, ...channelPages];
}
