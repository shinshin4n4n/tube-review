/**
 * デモデータ自動生成スクリプト
 *
 * 実行方法:
 * npx tsx scripts/generate-demo-data.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES } from '../lib/constants/categories';

// NODE_ENV=productionの場合は.env.production.localを読み込む
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production.local'
  : '.env.local';

config({ path: resolve(process.cwd(), envFile) });
console.log(`📝 環境変数ファイル: ${envFile}`);

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// YouTube API設定
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// カテゴリごとの検索キーワード
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  entertainment: ['エンタメ', 'バラエティ', 'お笑い'],
  gaming: ['ゲーム実況', 'ゲーム'],
  music: ['音楽', '歌ってみた', 'ボカロ'],
  education: ['教育', '解説', '勉強'],
  tech: ['プログラミング', 'ガジェット', 'IT'],
  lifestyle: ['ライフスタイル', '美容', 'ファッション'],
  sports: ['スポーツ', 'フィットネス', 'サッカー'],
  news: ['ニュース', '時事', '政治'],
  cooking: ['料理', 'レシピ', 'グルメ'],
  travel: ['旅行', '観光', '旅'],
  vlog: ['Vlog', '日常', 'ルーティン'],
};

// ダミーユーザー名
const DUMMY_USERNAMES = [
  'ユウキ', 'サクラ', 'ハルト', 'アイ', 'ソウタ',
  'ユイ', 'リク', 'ヒナ', 'ユウト', 'ミユ',
  'ハル', 'アオイ', 'タクミ', 'メイ', 'ケンタ',
  'リナ', 'カイト', 'ナナ', 'ショウ', 'エマ'
];

// レビューテンプレート
const REVIEW_TEMPLATES = {
  positive: [
    'このチャンネルは本当に素晴らしいです！{reason}特に最新の動画はクオリティが高く、何度も見返してしまいました。これからも応援しています！',
    '登録して本当に良かったです。{reason}毎回新しい動画が楽しみで仕方ありません。友達にもおすすめしています！',
    '最高のチャンネルです！{reason}編集も丁寧で、内容も充実しています。もっと多くの人に知ってもらいたいです。',
    'いつも楽しく視聴しています。{reason}このチャンネルのおかげで新しい知識や発見がたくさんありました。感謝しています！',
    '素晴らしいコンテンツをありがとうございます。{reason}これからも質の高い動画を期待しています！',
  ],
  neutral: [
    '全体的に良いチャンネルだと思います。{reason}ただ、もう少し更新頻度が上がると嬉しいです。今後に期待しています。',
    '面白いコンテンツが多いです。{reason}たまに内容が薄い回もありますが、基本的には楽しめています。',
    '安定して見られるチャンネルです。{reason}特に目立った欠点はありませんが、もう少し個性があると良いかもしれません。',
    '興味深い内容が多いです。{reason}ただ、説明がもう少し詳しいと助かります。それでも十分楽しめています。',
  ],
  negative: [
    '期待していたのですが、少し残念でした。{reason}もう少し工夫があれば良いチャンネルになると思います。',
    '内容は悪くないのですが、{reason}編集や構成を改善すれば、もっと良くなると思います。',
  ],
};

const REVIEW_REASONS = [
  '解説がとても分かりやすく、初心者でも理解しやすい内容になっています。',
  '独自の視点や切り口が新鮮で、毎回新しい発見があります。',
  '編集のテンポが良く、飽きずに最後まで見られます。',
  '実用的な情報が多く、すぐに役立てることができました。',
  'エンターテイメント性が高く、楽しみながら学べる内容です。',
  '投稿者の人柄が伝わってきて、親しみやすい雰囲気が良いです。',
  'クオリティが高く、プロフェッショナルな仕上がりになっています。',
  '幅広いテーマを扱っていて、飽きることがありません。',
  'コメント欄での交流も活発で、コミュニティが素晴らしいです。',
  '更新頻度が安定していて、定期的に楽しめます。',
];

/**
 * YouTube APIでチャンネルを検索
 */
async function searchYouTubeChannels(keyword: string, maxResults: number = 5): Promise<any[]> {
  try {
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&type=channel&q=${encodeURIComponent(keyword)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}&regionCode=JP&relevanceLanguage=ja`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      return [];
    }

    return data.items || [];
  } catch (error) {
    console.error('Error searching channels:', error);
    return [];
  }
}

/**
 * YouTube APIでチャンネル詳細を取得
 */
async function getChannelDetails(channelId: string): Promise<any | null> {
  try {
    const detailsUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (!response.ok || !data.items || data.items.length === 0) {
      return null;
    }

    return data.items[0];
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return null;
  }
}

/**
 * 登録者数でフィルタリング
 */
function filterBySubscriberCount(channels: any[], min: number = 10000, max: number = 1000000): any[] {
  return channels.filter(channel => {
    const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0');
    return subscriberCount >= min && subscriberCount <= max;
  });
}

/**
 * ランダムなレビューを生成
 */
function generateReview(rating: number): { title: string; content: string } {
  let templates: string[];

  if (rating >= 4) {
    templates = REVIEW_TEMPLATES.positive;
  } else if (rating >= 3) {
    templates = REVIEW_TEMPLATES.neutral;
  } else {
    templates = REVIEW_TEMPLATES.negative;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  const reason = REVIEW_REASONS[Math.floor(Math.random() * REVIEW_REASONS.length)];
  const content = template.replace('{reason}', reason);

  // タイトルを生成（本文の最初の30文字程度）
  const title = content.substring(0, 30) + '...';

  return { title, content };
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 デモデータ生成を開始します...\n');

  // ステップ1: ダミーユーザーを作成
  console.log('👤 ステップ1: ダミーユーザーを作成中...');
  const userIds: string[] = [];

  for (const username of DUMMY_USERNAMES) {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const displayName = `${username}さん`;

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username: username.toLowerCase(),
        display_name: displayName,
        avatar_url: avatarUrl,
        email: `${username.toLowerCase()}@demo.example.com`,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ ユーザー作成エラー (${username}):`, error.message);
      continue;
    }

    userIds.push(user.id);
    console.log(`  ✅ ${displayName} を作成しました`);
  }

  console.log(`\n✅ ${userIds.length}人のユーザーを作成しました\n`);

  // ステップ2: 各カテゴリのチャンネルを検索・取得
  console.log('📺 ステップ2: チャンネルを検索・取得中...\n');
  const allChannels: any[] = [];

  for (const category of CATEGORIES) {
    console.log(`\n📂 カテゴリ: ${category.name} (${category.slug})`);
    const keywords = CATEGORY_KEYWORDS[category.slug] || [category.name];
    const categoryChannels: any[] = [];

    for (const keyword of keywords) {
      console.log(`  🔍 キーワード「${keyword}」で検索中...`);

      const searchResults = await searchYouTubeChannels(keyword, 10);

      for (const result of searchResults) {
        if (categoryChannels.length >= 5) break;

        const channelId = result.snippet.channelId;
        const details = await getChannelDetails(channelId);

        if (!details) continue;

        const subscriberCount = parseInt(details.statistics.subscriberCount || '0');

        // 登録者数フィルタ（1万～100万人）
        if (subscriberCount < 10000 || subscriberCount > 1000000) {
          console.log(`    ⏭️  スキップ: ${details.snippet.title} (登録者: ${subscriberCount.toLocaleString()}人)`);
          continue;
        }

        // データベースに保存
        const { data: channel, error } = await supabase
          .from('channels')
          .upsert({
            youtube_channel_id: channelId,
            title: details.snippet.title,
            description: details.snippet.description || null,
            thumbnail_url: details.snippet.thumbnails?.high?.url || details.snippet.thumbnails?.default?.url,
            subscriber_count: subscriberCount,
            video_count: parseInt(details.statistics.videoCount || '0'),
            category: category.slug,
            cache_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'youtube_channel_id',
          })
          .select()
          .single();

        if (error) {
          console.error(`    ❌ エラー:`, error.message);
          continue;
        }

        categoryChannels.push(channel);
        allChannels.push(channel);
        console.log(`    ✅ ${channel.title} (登録者: ${subscriberCount.toLocaleString()}人)`);

        // APIレート制限対策
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (categoryChannels.length >= 5) break;
    }

    console.log(`  ✅ ${category.name}: ${categoryChannels.length}チャンネル追加`);
  }

  console.log(`\n✅ 合計 ${allChannels.length} チャンネルを追加しました\n`);

  // ステップ3: レビューを生成
  console.log('💬 ステップ3: レビューを生成中...\n');
  let reviewCount = 0;

  for (const channel of allChannels) {
    const numReviews = Math.floor(Math.random() * 3) + 3; // 3-5レビュー
    console.log(`  📝 ${channel.title}: ${numReviews}件のレビューを生成中...`);

    for (let i = 0; i < numReviews; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5の評価（ポジティブ多め）
      const { title, content } = generateReview(rating);

      // ランダムな日時（過去7日間）
      const randomDaysAgo = Math.floor(Math.random() * 7);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - randomDaysAgo);

      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          channel_id: channel.id,
          rating,
          title,
          content,
          is_spoiler: false,
          created_at: createdAt.toISOString(),
        });

      if (error && error.code !== '23505') { // 重複エラーは無視
        console.error(`    ❌ レビュー作成エラー:`, error.message);
        continue;
      }

      if (!error) {
        reviewCount++;
      }
    }
  }

  console.log(`\n✅ ${reviewCount}件のレビューを作成しました\n`);

  // 完了
  console.log('🎉 デモデータの生成が完了しました！\n');
  console.log('📊 生成されたデータ:');
  console.log(`  - ユーザー: ${userIds.length}人`);
  console.log(`  - チャンネル: ${allChannels.length}個`);
  console.log(`  - レビュー: ${reviewCount}件`);
  console.log('\n✨ アプリでランキングとレビューを確認してください！');
}

// 実行
main().catch(console.error);
