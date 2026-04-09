/**
 * channels_with_stats ビューと channels テーブルの view_count 状態を確認するスクリプト
 *
 * 使用方法:
 * SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/check-view-count.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please run:');
  console.error('SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/check-view-count.ts');
  process.exit(1);
}

async function checkViewCount() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 Checking view_count in database...\n');

  // 1. channels_with_stats ビューのカラム構造を確認
  console.log('1️⃣ Checking columns in channels_with_stats view:');
  const { data: viewColumns, error: viewColError } = await supabase
    .rpc('get_view_columns', { view_name: 'channels_with_stats' })
    .single();

  if (viewColError) {
    console.log('❌ Could not query view columns directly. Trying alternative method...');

    // 代替方法: 実際のデータから推測
    const { data: sampleData, error: sampleError } = await supabase
      .from('channels_with_stats')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError.message);
    } else {
      console.log('✅ Available columns in channels_with_stats:');
      console.log(Object.keys(sampleData || {}).join(', '));
      console.log('\n🔍 view_count present?', 'view_count' in (sampleData || {}));
    }
  }

  // 2. channels テーブルから直接データを確認
  console.log('\n2️⃣ Checking data in channels table (first 3 records):');
  const { data: channelsData, error: channelsError } = await supabase
    .from('channels')
    .select('id, title, subscriber_count, video_count, view_count')
    .limit(3);

  if (channelsError) {
    console.error('❌ Error fetching channels:', channelsError.message);
  } else {
    console.table(channelsData);
  }

  // 3. channels_with_stats ビューから同じデータを確認
  console.log('\n3️⃣ Checking data in channels_with_stats view (first 3 records):');
  const { data: viewData, error: viewError } = await supabase
    .from('channels_with_stats')
    .select('id, title, subscriber_count, video_count, review_count')
    .limit(3);

  if (viewError) {
    console.error('❌ Error fetching view data:', viewError.message);
  } else {
    console.table(viewData);
  }

  // 4. view_count の統計を確認
  console.log('\n4️⃣ Statistics for view_count in channels table:');
  const { data: stats, error: statsError } = await supabase
    .from('channels')
    .select('view_count');

  if (statsError) {
    console.error('❌ Error fetching stats:', statsError.message);
  } else {
    const viewCounts = stats?.map(c => c.view_count || 0) || [];
    const nonZeroCount = viewCounts.filter(v => v > 0).length;
    const zeroCount = viewCounts.filter(v => v === 0).length;
    const nullCount = viewCounts.filter(v => v === null).length;

    console.log(`Total channels: ${viewCounts.length}`);
    console.log(`Channels with view_count > 0: ${nonZeroCount}`);
    console.log(`Channels with view_count = 0: ${zeroCount}`);
    console.log(`Channels with view_count = NULL: ${nullCount}`);

    if (nonZeroCount > 0) {
      const max = Math.max(...viewCounts);
      const avg = viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length;
      console.log(`Max view_count: ${max.toLocaleString()}`);
      console.log(`Avg view_count: ${Math.round(avg).toLocaleString()}`);
    }
  }

  // 5. 特定のチャンネルを詳細確認（存在する場合）
  console.log('\n5️⃣ Detailed check for a specific channel:');
  const { data: detailData, error: detailError } = await supabase
    .from('channels')
    .select('*')
    .limit(1)
    .single();

  if (detailError) {
    console.error('❌ Error fetching channel detail:', detailError.message);
  } else if (detailData) {
    console.log('Channel ID:', detailData.id);
    console.log('Title:', detailData.title);
    console.log('YouTube ID:', detailData.youtube_channel_id);
    console.log('Subscriber Count:', detailData.subscriber_count?.toLocaleString());
    console.log('Video Count:', detailData.video_count?.toLocaleString());
    console.log('View Count:', detailData.view_count?.toLocaleString());
    console.log('Cache Updated:', detailData.cache_updated_at);
  }

  console.log('\n✅ Check completed!');
}

checkViewCount().catch(console.error);
