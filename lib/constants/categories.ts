/**
 * カテゴリー定義
 *
 * YouTubeチャンネルのカテゴリー分類に使用
 */

export interface Category {
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES = [
  {
    slug: 'entertainment',
    name: 'エンタメ',
    icon: '🎭',
    description: 'バラエティ、お笑い、エンターテイメント系チャンネル',
  },
  {
    slug: 'gaming',
    name: 'ゲーム',
    icon: '🎮',
    description: 'ゲーム実況、攻略、eスポーツ系チャンネル',
  },
  {
    slug: 'music',
    name: '音楽',
    icon: '🎵',
    description: '音楽、歌ってみた、演奏、ライブ配信系チャンネル',
  },
  {
    slug: 'education',
    name: '教育',
    icon: '📚',
    description: '学習、解説、教育系チャンネル',
  },
  {
    slug: 'tech',
    name: 'テクノロジー',
    icon: '💻',
    description: 'プログラミング、IT、ガジェット系チャンネル',
  },
  {
    slug: 'lifestyle',
    name: 'ライフスタイル',
    icon: '🌿',
    description: '日常、美容、ファッション系チャンネル',
  },
  {
    slug: 'sports',
    name: 'スポーツ',
    icon: '⚽',
    description: 'スポーツ、フィットネス、アウトドア系チャンネル',
  },
  {
    slug: 'news',
    name: 'ニュース',
    icon: '📰',
    description: 'ニュース、時事、解説系チャンネル',
  },
  {
    slug: 'cooking',
    name: '料理',
    icon: '🍳',
    description: '料理、レシピ、グルメ系チャンネル',
  },
  {
    slug: 'travel',
    name: '旅行',
    icon: '✈️',
    description: '旅行、観光系チャンネル',
  },
  {
    slug: 'vlog',
    name: 'Vlog',
    icon: '📹',
    description: '日常Vlog、ライフスタイル系チャンネル',
  },
] as const satisfies readonly Category[];

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

/**
 * カテゴリースラッグからカテゴリー情報を取得
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * カテゴリースラッグの配列を取得
 */
export function getAllCategorySlugs(): string[] {
  return CATEGORIES.map((cat) => cat.slug);
}
