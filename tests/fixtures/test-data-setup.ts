import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * テストデータのセットアップ
 * E2Eテスト実行前にSupabaseデータベースにテスト用のチャンネルデータを投入する
 */

// .env.localから環境変数を読み込む
// worktreeから実行される場合を考慮して、親ディレクトリも確認する
const envPath = path.resolve(process.cwd(), '.env.local');
const envExists = require('fs').existsSync(envPath);

if (!envExists) {
  // worktreeの場合、親ディレクトリの.env.localを使用
  const parentEnvPath = path.resolve(__dirname, '../../../.env.local');
  if (require('fs').existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
  } else {
    dotenv.config({ path: envPath }); // フォールバック
  }
} else {
  dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Test data setup will be skipped.'
  );
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * テスト用チャンネルデータ
 * 既存のデータベースから取得したデータを使用
 */
const testChannels = [
  {
    youtube_channel_id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Google Developers',
    description:
      'The Google Developers channel features talks from events, educational series, best practices, and more.',
    thumbnail_url: 'https://yt3.ggpht.com/ytc/high.jpg',
    subscriber_count: 2500000,
    video_count: 5000,
    view_count: 500000000,
    cache_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    youtube_channel_id: 'UCZf__ehlCEBPop-_sldpBUQ',
    title: 'HikakinTV',
    description:
      '登録ありがとうございます。\n◆プロフィール◆\nYouTubeにてHIKAKIN、HikakinTV、HikakinGames、HiakkinClipTV、HikakinBlogと\n5つのチャンネルを運営し、動画の総アクセス数は180億回を突破、\nチャンネル登録者数は計2000万人以上、YouTubeタレント事務所uuum株式会社ファウンダー兼最高顧問。',
    thumbnail_url:
      'https://yt3.ggpht.com/kTCjv_Oh6U18R1VgElKFG3xDOK9xM1m9FcNCQkQHEP3dFEDjDoBj7DIhL7r0wVl94L9G_onKIZ4=s800-c-k-c0x00ffffff-no-rj',
    subscriber_count: 19600000,
    video_count: 3676,
    view_count: 15052480036,
    cache_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * テストデータをデータベースに投入
 */
export async function setupTestData() {
  if (!supabase) {
    console.log('⚠️ Supabase client not initialized. Skipping test data setup.');
    return;
  }

  console.log('📦 Setting up test data...');
  console.log(`   Supabase URL: ${supabaseUrl?.substring(0, 50)}...`);

  try {
    console.log(`📝 Attempting to upsert ${testChannels.length} channels...`);

    // チャンネルデータを投入（既存の場合は更新）
    const { data, error } = await supabase.from('channels').upsert(testChannels, {
      onConflict: 'youtube_channel_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('❌ Failed to setup test data:', error);
      console.error('   Error message:', error.message);
      console.error('   Error details:', JSON.stringify(error.details));
      // エラーが発生してもテストは続行する（既存データがあれば問題ない）
      return;
    }

    console.log(`✅ Test data setup complete. Inserted/Updated ${testChannels.length} channels.`);
    console.log(`   Response:`, JSON.stringify(data).substring(0, 100));
  } catch (err) {
    console.error('❌ Unexpected error during test data setup:', err);
    console.error('   Error stack:', (err as Error).stack);
  }
}

/**
 * テストデータをクリーンアップ（オプション）
 * 通常は不要だが、テスト環境をクリーンな状態に戻したい場合に使用
 */
export async function cleanupTestData() {
  if (!supabase) {
    console.log('⚠️ Supabase client not initialized. Skipping test data cleanup.');
    return;
  }

  console.log('🧹 Cleaning up test data...');

  try {
    const channelIds = testChannels.map((ch) => ch.youtube_channel_id);

    const { error } = await supabase
      .from('channels')
      .delete()
      .in('youtube_channel_id', channelIds);

    if (error) {
      console.error('❌ Failed to cleanup test data:', error.message);
      return;
    }

    console.log(`✅ Test data cleanup complete. Deleted ${channelIds.length} channels.`);
  } catch (err) {
    console.error('❌ Unexpected error during test data cleanup:', err);
  }
}

/**
 * グローバルセットアップ用のエクスポート
 */
export default async function globalSetup() {
  console.log('🚀 Global setup started...');
  console.log(`   CWD: ${process.cwd()}`);
  console.log(`   __dirname: ${__dirname}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_URL exists: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

  await setupTestData();
  console.log('✅ Global setup completed!');
}
