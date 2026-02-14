/**
 * チャンネルを自動分類するスクリプト
 * チャンネルのタイトルと説明文を元にカテゴリーを自動割り当て
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { CATEGORIES, type CategorySlug } from '../lib/constants/categories';

// .env.localファイルから環境変数を読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Supabase接続
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Channel {
  id: string;
  title: string;
  description: string | null;
  youtube_channel_id: string;
}

/**
 * キーワードベースでカテゴリーを判定
 */
function classifyChannelByKeywords(channel: Channel): CategorySlug {
  const text = `${channel.title} ${channel.description || ''}`.toLowerCase();

  // カテゴリー別キーワード定義
  const keywordMap: Record<CategorySlug, string[]> = {
    gaming: [
      'ゲーム',
      'game',
      'gaming',
      'ゲーミング',
      '実況',
      'プレイ',
      'play',
      'minecraft',
      'マイクラ',
      'apex',
      'fps',
      'rpg',
      'eスポーツ',
      'esports',
    ],
    music: [
      '音楽',
      'music',
      '歌',
      'song',
      'うた',
      '歌ってみた',
      '演奏',
      'ライブ',
      'live',
      'バンド',
      'band',
      'ボカロ',
      'vocaloid',
      'ギター',
      'guitar',
      'ピアノ',
      'piano',
    ],
    entertainment: [
      'エンタメ',
      'entertainment',
      'お笑い',
      'バラエティ',
      'variety',
      'コメディ',
      'comedy',
      '芸人',
      '漫才',
      'トーク',
      'talk',
    ],
    education: [
      '教育',
      'education',
      '学習',
      '勉強',
      '授業',
      '講座',
      '解説',
      'study',
      'learn',
      '英語',
      'english',
      '数学',
      'math',
      '科学',
      'science',
      '歴史',
      'history',
    ],
    tech: [
      'テクノロジー',
      'technology',
      'tech',
      'プログラミング',
      'programming',
      'エンジニア',
      'engineer',
      'コーディング',
      'coding',
      'it',
      'ガジェット',
      'gadget',
      'アプリ',
      'app',
      'web',
      'ai',
    ],
    lifestyle: [
      'ライフスタイル',
      'lifestyle',
      '日常',
      '暮らし',
      '美容',
      'beauty',
      'ファッション',
      'fashion',
      'メイク',
      'makeup',
      'コスメ',
      'cosmetic',
    ],
    sports: [
      'スポーツ',
      'sports',
      'サッカー',
      'soccer',
      'football',
      '野球',
      'baseball',
      'バスケ',
      'basketball',
      'フィットネス',
      'fitness',
      'トレーニング',
      'training',
      'ワークアウト',
      'workout',
      '剣道',
      'kendo',
      '武道',
      'martial',
      '柔道',
      'judo',
      '空手',
      'karate',
      'ビリヤード',
      'billiard',
      'pool',
      'ボウリング',
      'bowling',
      'テニス',
      'tennis',
      'ゴルフ',
      'golf',
      'ラグビー',
      'rugby',
      'バレー',
      'volleyball',
      '卓球',
      'table tennis',
      'アウトドア',
      'outdoor',
    ],
    news: [
      'ニュース',
      'news',
      '報道',
      '時事',
      '政治',
      'politics',
      '経済',
      'economy',
      'ビジネス',
      'business',
    ],
    cooking: [
      '料理',
      'cooking',
      'cook',
      'レシピ',
      'recipe',
      '食',
      'food',
      'グルメ',
      'gourmet',
      '飯',
      'めし',
      '食べ',
      'eat',
      'おやつ',
      'スイーツ',
      'sweets',
    ],
    travel: [
      '旅',
      'travel',
      '旅行',
      '観光',
      'tour',
      'tourism',
      '海外',
      'overseas',
      '世界',
      'world',
    ],
    vlog: [
      'vlog',
      'ブイログ',
      'ブログ',
      'blog',
      '日記',
      'diary',
      'daily',
      'デイリー',
    ],
  };

  // 各カテゴリーのマッチ度を計算
  const scores: Record<CategorySlug, number> = {
    entertainment: 0,
    gaming: 0,
    music: 0,
    education: 0,
    tech: 0,
    lifestyle: 0,
    sports: 0,
    news: 0,
    cooking: 0,
    travel: 0,
    vlog: 0,
  };

  for (const [category, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category as CategorySlug] += 1;
      }
    }
  }

  // 最もスコアの高いカテゴリーを選択
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    const bestCategory = Object.entries(scores).find(
      ([, score]) => score === maxScore
    )?.[0] as CategorySlug;
    return bestCategory;
  }

  // どのキーワードにもマッチしない場合はエンタメにする
  return 'entertainment';
}

/**
 * カテゴリー未設定のチャンネルを取得
 */
async function getUnclassifiedChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('id, title, description, youtube_channel_id')
    .is('category', null);

  if (error) {
    throw new Error(`Failed to fetch unclassified channels: ${error.message}`);
  }

  return data || [];
}

/**
 * チャンネルのカテゴリーを更新
 */
async function updateChannelCategory(
  channelId: string,
  category: string
): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .update({ category })
    .eq('id', channelId);

  if (error) {
    throw new Error(
      `Failed to update channel ${channelId}: ${error.message}`
    );
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔍 カテゴリー未設定のチャンネルを取得中...');
  const channels = await getUnclassifiedChannels();

  console.log(`📊 ${channels.length}件のチャンネルが見つかりました\n`);

  if (channels.length === 0) {
    console.log('✅ すべてのチャンネルにカテゴリーが設定済みです');
    return;
  }

  const results: { channel: string; category: string }[] = [];

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i]!;
    console.log(`[${i + 1}/${channels.length}] 分類中: ${channel.title}`);

    try {
      // キーワードベースで分類
      const category = classifyChannelByKeywords(channel);

      // データベース更新
      await updateChannelCategory(channel.id, category);

      const categoryInfo = CATEGORIES.find((cat) => cat.slug === category);
      console.log(
        `  ✅ ${categoryInfo?.icon} ${categoryInfo?.name} (${category})\n`
      );

      results.push({
        channel: channel.title,
        category: `${categoryInfo?.icon} ${categoryInfo?.name}`,
      });
    } catch (error) {
      console.error(`  ❌ エラー: ${error}\n`);
    }
  }

  console.log('\n📈 分類結果サマリー:');
  console.log('═'.repeat(60));

  // カテゴリー別に集計
  const categoryCounts = results.reduce(
    (acc, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`${category}: ${count}件`);
    });

  console.log(`\n✅ ${results.length}件のチャンネルを自動分類しました！`);
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
