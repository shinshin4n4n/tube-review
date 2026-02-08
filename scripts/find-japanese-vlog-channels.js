require('dotenv').config({ path: '.env.local' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// 実在する日本のVLOG/ライフスタイル系YouTubeチャンネル候補（追加）
const japaneseChannelCandidates = [
  { name: 'きりまる', id: 'UCTJnEdlzheAcGj-3N9P0rcg' },
  { name: 'Emma Chamberlain', id: 'UC78cxCAcp7JfQPgKxYdyGrg' }, // 人気Vlogger（英語だが参考）
  { name: 'ヒカキンTV', id: 'UCZf__ehlCEBPop-_sldpBUQ' }, // 既存だが確認
  { name: '水溜りボンド', id: 'UCpOjLndjOqMoffA-fr8cbKA' }, // 既存だが確認
  { name: 'きまぐれクック', id: 'UCaak9sggUeIBPOd8iK_BXcQ' }, // 料理Vlog的
  { name: 'ばんばんざい', id: 'UCUJ3iNtc2mU4DdGKdwxW_QQ' },
  { name: 'コムドット', id: 'UCRxPrFmRHsXGWfAyE6oqrPQ' }, // 既存だが確認
];

async function checkChannel(channelId, name) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        valid: true,
        name: name,
        youtubeTitle: channel.snippet.title,
        channelId: channelId,
        description: channel.snippet.description.substring(0, 150) + '...',
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        publishedAt: channel.snippet.publishedAt,
      };
    } else {
      return { valid: false, name, channelId };
    }
  } catch (error) {
    return { valid: false, name, channelId, error: error.message };
  }
}

(async () => {
  console.log('日本のVLOG/ライフスタイル系チャンネルを確認中...\n');

  const validChannels = [];

  for (const candidate of japaneseChannelCandidates) {
    console.log(`確認中: ${candidate.name}`);
    const result = await checkChannel(candidate.id, candidate.name);

    if (result.valid) {
      console.log(`  ✅ ${result.youtubeTitle}`);
      console.log(`     登録者: ${result.subscriberCount.toLocaleString()}人`);
      validChannels.push(result);
    } else {
      console.log(`  ❌ 無効`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n\n有効なチャンネル: ${validChannels.length}件\n`);

  validChannels.forEach((channel, index) => {
    console.log(`${index + 1}. ${channel.youtubeTitle}`);
    console.log(`   Channel ID: ${channel.channelId}`);
    console.log(`   登録者数: ${channel.subscriberCount.toLocaleString()}人`);
    console.log('');
  });
})();
