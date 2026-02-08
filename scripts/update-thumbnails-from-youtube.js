require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function getChannelThumbnail(youtubeChannelId) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${youtubeChannelId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const thumbnails = data.items[0].snippet.thumbnails;
      // 高解像度のサムネイルを優先
      return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch thumbnail for ${youtubeChannelId}:`, error.message);
    return null;
  }
}

async function updateChannelThumbnails() {
  console.log('YouTube APIから正しいサムネイルURLを取得して更新します...\n');

  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY が設定されていません');
    console.log('💡 .env.local に YOUTUBE_API_KEY を設定してください');
    process.exit(1);
  }

  // データベースから全チャンネルを取得
  const { data: channels, error } = await supabase
    .from('channels')
    .select('id, title, youtube_channel_id, thumbnail_url');

  if (error) {
    console.error('❌ チャンネル取得エラー:', error);
    process.exit(1);
  }

  console.log(`${channels.length}件のチャンネルを処理します...\n`);

  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const channel of channels) {
    console.log(`処理中: ${channel.title}`);

    // YouTube APIからサムネイルURLを取得
    const newThumbnailUrl = await getChannelThumbnail(channel.youtube_channel_id);

    if (newThumbnailUrl) {
      if (newThumbnailUrl !== channel.thumbnail_url) {
        // データベースを更新
        const { error: updateError } = await supabase
          .from('channels')
          .update({ thumbnail_url: newThumbnailUrl })
          .eq('id', channel.id);

        if (updateError) {
          console.error(`  ❌ 更新失敗: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ サムネイルURL更新: ${newThumbnailUrl.substring(0, 50)}...`);
          updateCount++;
        }
      } else {
        console.log(`  ⏭️  変更なし`);
        skipCount++;
      }
    } else {
      console.log(`  ⚠️  サムネイル取得失敗`);
      errorCount++;
    }

    // APIレート制限を避けるため少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n処理完了:');
  console.log(`  更新: ${updateCount}件`);
  console.log(`  スキップ: ${skipCount}件`);
  console.log(`  エラー: ${errorCount}件`);
}

updateChannelThumbnails();
