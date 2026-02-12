import { createClient } from '@supabase/supabase-js';

/**
 * テストデータのセットアップ
 * E2Eテスト実行前にSupabaseデータベースにテスト用のチャンネルデータを投入する
 */

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
 */
const testChannels = [
  {
    youtube_channel_id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    title: 'Google Developers',
    description:
      'The Google Developers channel features talks from events, educational series, best practices, and more.',
    custom_url: 'GoogleDevelopers',
    thumbnail_url: 'https://yt3.ggpht.com/ytc/high.jpg',
    subscriber_count: 2500000,
    video_count: 5000,
    view_count: 500000000,
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

  try {
    // チャンネルデータを投入（既存の場合は更新）
    const { data, error } = await supabase.from('channels').upsert(testChannels, {
      onConflict: 'youtube_channel_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('❌ Failed to setup test data:', error.message);
      // エラーが発生してもテストは続行する（既存データがあれば問題ない）
      return;
    }

    console.log(`✅ Test data setup complete. Inserted/Updated ${testChannels.length} channels.`);
  } catch (err) {
    console.error('❌ Unexpected error during test data setup:', err);
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
  await setupTestData();
}
