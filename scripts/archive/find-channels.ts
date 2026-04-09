/**
 * YouTube APIでチャンネルを検索して正しいIDを取得するスクリプト
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// 検索するチャンネル名
const channelNamesToSearch = [
  'コムドット',
  'ヒカル Hikaru',
  '水溜りボンド',
  'Fischer\'s-フィッシャーズ',
  'QuizKnock クイズノック',
  'スカイピース',
  'Bayashi TV',
  'きまぐれクック',
];

async function searchChannel(channelName: string) {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/search`);
  url.searchParams.append('part', 'snippet');
  url.searchParams.append('type', 'channel');
  url.searchParams.append('q', channelName);
  url.searchParams.append('maxResults', '3');
  url.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getChannelDetails(youtubeChannelId: string) {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/channels`);
  url.searchParams.append('part', 'snippet,statistics');
  url.searchParams.append('id', youtubeChannelId);
  url.searchParams.append('key', process.env.YOUTUBE_API_KEY!);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
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

async function findChannels() {
  console.log('🔍 チャンネルを検索しています...\n');

  const results: any[] = [];

  for (const channelName of channelNamesToSearch) {
    console.log(`検索中: ${channelName}`);

    try {
      const searchResults = await searchChannel(channelName);

      if (searchResults.length === 0) {
        console.log(`  ⚠️  チャンネルが見つかりませんでした\n`);
        continue;
      }

      // 最も登録者数が多そうな最初の結果を取得
      const topResult = searchResults[0];
      const channelId = topResult.id.channelId;

      // 詳細を取得
      const details = await getChannelDetails(channelId);

      if (details) {
        console.log(`  ✅ 発見: ${details.title}`);
        console.log(`     ID: ${details.youtubeChannelId}`);
        console.log(`     登録者数: ${details.subscriberCount.toLocaleString()}`);
        console.log(`     動画数: ${details.videoCount.toLocaleString()}\n`);

        results.push(details);
      }

      // レート制限対策
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ❌ エラー: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 検索結果');
  console.log('='.repeat(70));
  console.log(`発見したチャンネル数: ${results.length}個\n`);

  results.forEach((channel, index) => {
    console.log(`${index + 1}. ${channel.title}`);
    console.log(`   ID: ${channel.youtubeChannelId}`);
    console.log(`   登録者数: ${channel.subscriberCount.toLocaleString()}`);
    console.log(`   カスタムURL: ${channel.customUrl || 'なし'}`);
    console.log('');
  });

  return results;
}

findChannels()
  .then((results) => {
    console.log('✨ 検索が完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 エラー:', error);
    process.exit(1);
  });
