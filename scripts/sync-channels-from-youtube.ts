/**
 * YouTube APIからチャンネルデータを取得してDBを更新するスクリプト
 *
 * 使い方:
 * 1. 環境変数を設定（.env.localに記載）
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - YOUTUBE_API_KEY
 *
 * 2. 実行
 *    npm run sync-channels
 *    または
 *    node --loader ts-node/esm scripts/sync-channels-from-youtube.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込み
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

// Supabaseクライアント
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Data APIからチャンネル詳細を取得
 */
async function getChannelDetails(youtubeChannelId: string) {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/channels`);
  url.searchParams.append('part', 'snippet,statistics');
  url.searchParams.append('id', youtubeChannelId);
  url.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error(`Channel not found: ${youtubeChannelId}`);
  }

  const channel = data.items[0];

  return {
    youtubeChannelId: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    customUrl: channel.snippet.customUrl,
    thumbnailUrl: channel.snippet.thumbnails.high.url,
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
    videoCount: parseInt(channel.statistics.videoCount, 10),
    viewCount: parseInt(channel.statistics.viewCount, 10),
  };
}

async function syncChannels() {
  console.log('🚀 チャンネルデータの同期を開始します...\n');

  // 環境変数チェック
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL が設定されていません');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  }
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY が設定されていません');
  }

  try {
    // DBからすべてのチャンネルを取得
    const { data: channels, error: fetchError } = await supabase
      .from('channels')
      .select('id, youtube_channel_id, title');

    if (fetchError) {
      throw new Error(`DBからのチャンネル取得に失敗: ${fetchError.message}`);
    }

    if (!channels || channels.length === 0) {
      console.log('⚠️  DBにチャンネルが存在しません');
      return;
    }

    console.log(`📊 ${channels.length}個のチャンネルを処理します\n`);

    let successCount = 0;
    let errorCount = 0;

    // 各チャンネルをYouTube APIで更新
    for (const channel of channels) {
      console.log(`処理中: ${channel.title} (${channel.youtube_channel_id})`);

      try {
        // YouTube APIからチャンネル詳細を取得
        const youtubeData = await getChannelDetails(channel.youtube_channel_id);

        // DBを更新
        const { error: updateError } = await supabase
          .from('channels')
          .update({
            title: youtubeData.title,
            description: youtubeData.description,
            thumbnail_url: youtubeData.thumbnailUrl,
            subscriber_count: youtubeData.subscriberCount,
            video_count: youtubeData.videoCount,
            published_at: new Date().toISOString(), // APIから取得できない場合は現在時刻
            updated_at: new Date().toISOString(),
          })
          .eq('id', channel.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ 成功: ${channel.title}`);
        console.log(`   - サムネイル: ${youtubeData.thumbnailUrl}`);
        console.log(`   - 登録者数: ${youtubeData.subscriberCount.toLocaleString()}`);
        console.log(`   - 動画数: ${youtubeData.videoCount.toLocaleString()}\n`);

        successCount++;

        // レート制限を考慮して少し待機
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ エラー: ${channel.title}`);
        console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
        errorCount++;
      }
    }

    // Materialized Viewの更新案内
    console.log('\n📝 次のステップ:');
    console.log('   Supabase Studioで以下のSQLを実行してください:');
    console.log('   REFRESH MATERIALIZED VIEW channel_stats;');

    // 結果サマリー
    console.log('\n' + '='.repeat(50));
    console.log('📈 同期結果');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${successCount}個`);
    console.log(`❌ 失敗: ${errorCount}個`);
    console.log(`📊 合計: ${channels.length}個`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ スクリプト実行エラー:');
    console.error(error);
    process.exit(1);
  }
}

// スクリプト実行
syncChannels()
  .then(() => {
    console.log('\n✨ 同期が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 予期せぬエラー:', error);
    process.exit(1);
  });
