/**
 * チャンネルサムネイル一括更新スクリプト
 *
 * YouTube APIからチャンネルの最新情報（サムネイル、登録者数、動画数）を取得し、
 * データベースを更新します。
 *
 * 実行方法:
 * npm run update-thumbnails (開発環境)
 * npm run update-thumbnails:prod (本番環境)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

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

if (!YOUTUBE_API_KEY) {
  console.error('❌ YOUTUBE_API_KEYが設定されていません');
  process.exit(1);
}

/**
 * YouTube APIでチャンネル詳細を取得
 */
async function getChannelDetails(channelId: string): Promise<any | null> {
  try {
    const detailsUrl = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('  ⚠️  YouTube API error:', data.error?.message || 'Unknown error');
      return null;
    }

    if (!data.items || data.items.length === 0) {
      console.error('  ⚠️  チャンネルが見つかりません');
      return null;
    }

    return data.items[0];
  } catch (error) {
    console.error('  ❌ Error fetching channel details:', error);
    return null;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 チャンネル情報の更新を開始します...\n');

  // カテゴリが設定されているチャンネルを取得
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, youtube_channel_id, title')
    .not('category', 'is', null)
    .order('title');

  if (error) {
    console.error('❌ チャンネル取得エラー:', error.message);
    process.exit(1);
  }

  if (!channels || channels.length === 0) {
    console.log('⚠️  更新対象のチャンネルがありません');
    return;
  }

  console.log(`🖼️  ${channels.length}チャンネルの情報を更新中...\n`);

  let successCount = 0;
  let errorCount = 0;
  let quotaUsed = 0;

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const progress = `[${i + 1}/${channels.length}]`;

    console.log(`${progress} ${channel.title}`);

    const details = await getChannelDetails(channel.youtube_channel_id);
    quotaUsed += 1; // channels.list は1ユニット消費

    if (!details) {
      errorCount++;
      console.log(`  ❌ 取得失敗\n`);
      continue;
    }

    const thumbnailUrl = details.snippet.thumbnails?.high?.url ||
                        details.snippet.thumbnails?.medium?.url ||
                        details.snippet.thumbnails?.default?.url;
    const subscriberCount = parseInt(details.statistics.subscriberCount || '0');
    const videoCount = parseInt(details.statistics.videoCount || '0');

    const { error: updateError } = await supabase
      .from('channels')
      .update({
        thumbnail_url: thumbnailUrl,
        subscriber_count: subscriberCount,
        video_count: videoCount,
        description: details.snippet.description || null,
        cache_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', channel.id);

    if (updateError) {
      errorCount++;
      console.log(`  ❌ 更新失敗: ${updateError.message}\n`);
      continue;
    }

    successCount++;
    console.log(`  ✅ 登録者: ${subscriberCount.toLocaleString()}人 | 動画: ${videoCount.toLocaleString()}本\n`);

    // APIレート制限対策（100ms待機）
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('🎉 チャンネル情報の更新が完了しました！\n');
  console.log('📊 実行結果:');
  console.log(`  - 成功: ${successCount}チャンネル`);
  console.log(`  - 失敗: ${errorCount}チャンネル`);
  console.log(`  - 消費クォータ: ${quotaUsed}ユニット (日次上限の${(quotaUsed / 10000 * 100).toFixed(2)}%)`);
  console.log('\n✨ アプリでサムネイルが表示されることを確認してください！');
}

// 実行
main().catch(console.error);
