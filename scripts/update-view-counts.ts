/**
 * view_count が 0 のチャンネルをYouTube APIから再取得して更新するスクリプト
 *
 * 使用方法:
 * npx tsx scripts/update-view-counts.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localを読み込む
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !YOUTUBE_API_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('Make sure .env.local contains:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('  - YOUTUBE_API_KEY');
  process.exit(1);
}

// YouTube APIクライアント
async function getChannelDetailsFromYouTube(youtubeChannelId: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeChannelId}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }

  const channel = data.items[0];
  return {
    viewCount: parseInt(channel.statistics.viewCount, 10),
    subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
    videoCount: parseInt(channel.statistics.videoCount, 10),
  };
}

async function updateViewCounts() {
  console.log('🔄 Starting view_count update process...\n');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // view_count が 0 または NULL のチャンネルを取得
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, youtube_channel_id, title, view_count')
    .or('view_count.eq.0,view_count.is.null')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching channels:', error);
    process.exit(1);
  }

  if (!channels || channels.length === 0) {
    console.log('✅ No channels need updating!');
    return;
  }

  console.log(`📊 Found ${channels.length} channels with view_count = 0 or NULL\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    console.log(`[${i + 1}/${channels.length}] Processing: ${channel.title}`);

    try {
      // YouTube APIからチャンネル詳細を取得
      const details = await getChannelDetailsFromYouTube(channel.youtube_channel_id);

      if (!details.viewCount || details.viewCount === 0) {
        console.log(`  ⚠️  View count is 0 from API, skipping...`);
        skippedCount++;
        continue;
      }

      // データベースを更新
      const { error: updateError } = await supabase
        .from('channels')
        .update({
          view_count: details.viewCount,
          subscriber_count: details.subscriberCount,
          video_count: details.videoCount,
          cache_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', channel.id);

      if (updateError) {
        console.error(`  ❌ Update failed:`, updateError.message);
        errorCount++;
      } else {
        console.log(`  ✅ Updated: ${details.viewCount.toLocaleString()} views`);
        successCount++;
      }

      // レート制限対策: 少し待機
      if (i < channels.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error(`  ❌ Error:`, err instanceof Error ? err.message : 'Unknown error');
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Update Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  ⚠️  Skipped: ${skippedCount}`);
  console.log(`  📊 Total: ${channels.length}`);
  console.log('='.repeat(50));
}

updateViewCounts().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
