'use server';

import { createClient } from '@/lib/supabase/server';
import { CATEGORIES, getCategoryBySlug } from '@/lib/constants/categories';
import type { Category } from '@/lib/constants/categories';

/**
 * カテゴリー情報（チャンネル数付き）
 */
export interface CategoryWithCount extends Category {
  channelCount: number;
  topChannels: {
    id: string;
    youtube_channel_id: string;
    thumbnail_url: string;
  }[];
}

/**
 * カテゴリー別チャンネル情報
 */
export interface CategoryChannel {
  id: string;
  youtube_channel_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  subscriber_count: number;
  review_count: number;
  average_rating: number;
  recent_review_count: number;
}

export type SortOption = 'popular' | 'latest' | 'subscribers';

/**
 * 全カテゴリー一覧をチャンネル数と代表チャンネルと共に取得
 */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();

  // 各カテゴリーのチャンネル数と代表チャンネルを取得
  const categoriesWithData = await Promise.all(
    CATEGORIES.map(async (category) => {
      // チャンネル数を取得
      const { count } = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true })
        .eq('category', category.slug);

      // 代表的なチャンネル（最大4つ）を取得
      const { data: topChannels } = await supabase
        .from('channels_with_stats')
        .select('id, youtube_channel_id, thumbnail_url')
        .eq('category', category.slug)
        .order('subscriber_count', { ascending: false })
        .limit(4);

      return {
        ...category,
        channelCount: count || 0,
        topChannels: topChannels || [],
      };
    })
  );

  // チャンネル数でソート（降順）
  return categoriesWithData.sort((a, b) => b.channelCount - a.channelCount);
}

/**
 * カテゴリー別チャンネル一覧を取得
 *
 * @param slug - カテゴリースラッグ
 * @param sort - ソート順（'popular': 人気順, 'latest': 新着順, 'subscribers': 登録者数順）
 * @param page - ページ番号（1始まり）
 * @param limit - 1ページあたりの件数
 */
export async function getChannelsByCategory(
  slug: string,
  sort: SortOption = 'popular',
  page = 1,
  limit = 20
): Promise<{
  channels: CategoryChannel[];
  totalCount: number;
  category: Category | null;
}> {
  const supabase = await createClient();

  // カテゴリー情報を取得
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      channels: [],
      totalCount: 0,
      category: null,
    };
  }

  // ソート順を決定
  let orderBy: { column: string; ascending: boolean };
  switch (sort) {
    case 'popular':
      orderBy = { column: 'recent_review_count', ascending: false };
      break;
    case 'latest':
      orderBy = { column: 'created_at', ascending: false };
      break;
    case 'subscribers':
      orderBy = { column: 'subscriber_count', ascending: false };
      break;
    default:
      orderBy = { column: 'recent_review_count', ascending: false };
  }

  // オフセットを計算
  const offset = (page - 1) * limit;

  // チャンネル一覧を取得
  const { data: channels, error: channelsError } = await supabase
    .from('channels_with_stats')
    .select(
      `
      id,
      youtube_channel_id,
      title,
      description,
      thumbnail_url,
      subscriber_count,
      review_count,
      average_rating,
      recent_review_count
    `
    )
    .eq('category', slug)
    .order(orderBy.column, { ascending: orderBy.ascending })
    .range(offset, offset + limit - 1);

  if (channelsError) {
    console.error('Error fetching channels by category:', channelsError);
    throw new Error('カテゴリー別チャンネルの取得に失敗しました');
  }

  // 総件数を取得
  const { count: totalCount } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('category', slug);

  return {
    channels: (channels || []) as CategoryChannel[],
    totalCount: totalCount || 0,
    category,
  };
}
