require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function checkChannel(youtubeChannelId, title) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeChannelId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      console.log(`✅ ${title}:`);
      console.log(`   YouTube Title: ${channel.snippet.title}`);
      console.log(`   Channel ID: ${youtubeChannelId}`);
      console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
      console.log(`   Thumbnail: ${channel.snippet.thumbnails.high.url}`);
      return true;
    } else {
      console.log(`❌ ${title}:`);
      console.log(`   Channel ID: ${youtubeChannelId}`);
      console.log(`   エラー: チャンネルが見つかりません`);
      if (data.error) {
        console.log(`   APIエラー: ${data.error.message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ ${title}:`);
    console.log(`   Channel ID: ${youtubeChannelId}`);
    console.log(`   エラー: ${error.message}`);
    return false;
  }
}

(async () => {
  console.log('VLOG系チャンネルのYouTubeチャンネルIDを確認します...\n');

  const { data: vlogChannels, error } = await supabase
    .from('channels')
    .select('title, youtube_channel_id')
    .eq('category', 'vlog');

  if (error) {
    console.error('エラー:', error);
    process.exit(1);
  }

  console.log(`${vlogChannels.length}件のVLOGチャンネルを確認します:\n`);

  for (const channel of vlogChannels) {
    await checkChannel(channel.youtube_channel_id, channel.title);
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
})();
