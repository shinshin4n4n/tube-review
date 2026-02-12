import { Page } from '@playwright/test';

/**
 * YouTube API モックデータ
 */
const mockChannels = {
  'UC_x5XG1OV2P6uZZ5FSM9Ttw': {
    id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    snippet: {
      title: 'Google Developers',
      description: 'The Google Developers channel features talks from events, educational series, best practices, and more.',
      customUrl: 'GoogleDevelopers',
      thumbnails: {
        default: { url: 'https://yt3.ggpht.com/ytc/default.jpg', width: 88, height: 88 },
        medium: { url: 'https://yt3.ggpht.com/ytc/medium.jpg', width: 240, height: 240 },
        high: { url: 'https://yt3.ggpht.com/ytc/high.jpg', width: 800, height: 800 },
      },
    },
    statistics: {
      subscriberCount: '2500000',
      videoCount: '5000',
      viewCount: '500000000',
    },
  },
};

/**
 * YouTube検索結果のモックデータ
 */
const mockSearchResults = [
  {
    kind: 'youtube#searchResult',
    id: { kind: 'youtube#channel', channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' },
    snippet: {
      channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
      title: 'Google Developers',
      description: 'The Google Developers channel features talks from events.',
      thumbnails: {
        default: { url: 'https://yt3.ggpht.com/ytc/default.jpg' },
        medium: { url: 'https://yt3.ggpht.com/ytc/medium.jpg' },
        high: { url: 'https://yt3.ggpht.com/ytc/high.jpg' },
      },
    },
  },
];

/**
 * YouTube APIをモック化する
 * E2Eテストで実際のYouTube APIを呼び出すとレート制限やエラーが発生するため、
 * Playwrightのネットワークインターセプトを使用してモックレスポンスを返す
 *
 * @param page - Playwrightのページオブジェクト
 */
export async function mockYouTubeAPI(page: Page) {
  // YouTube API 検索エンドポイントのモック
  await page.route('**/googleapis.com/youtube/v3/search*', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q') || '';

    console.log(`[Mock] YouTube Search API called with query: "${query}"`);

    // 検索クエリに基づいてフィルタリング（簡易実装）
    const filteredResults = mockSearchResults.filter((result) =>
      result.snippet.title.toLowerCase().includes(query.toLowerCase())
    );

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'youtube#searchListResponse',
        pageInfo: {
          totalResults: filteredResults.length,
          resultsPerPage: filteredResults.length,
        },
        items: filteredResults,
      }),
    });
  });

  // YouTube API チャンネル詳細エンドポイントのモック
  await page.route('**/googleapis.com/youtube/v3/channels*', async (route) => {
    const url = new URL(route.request().url());
    const channelId = url.searchParams.get('id');

    console.log(`[Mock] YouTube Channels API called with id: "${channelId}"`);

    if (channelId && mockChannels[channelId as keyof typeof mockChannels]) {
      const channel = mockChannels[channelId as keyof typeof mockChannels];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'youtube#channelListResponse',
          pageInfo: { totalResults: 1, resultsPerPage: 1 },
          items: [channel],
        }),
      });
    } else {
      // チャンネルが見つからない場合
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'youtube#channelListResponse',
          pageInfo: { totalResults: 0, resultsPerPage: 0 },
          items: [],
        }),
      });
    }
  });

  console.log('[Mock] YouTube API mocking enabled');
}

/**
 * YouTube APIのモックを無効化する
 * @param page - Playwrightのページオブジェクト
 */
export async function unmockYouTubeAPI(page: Page) {
  await page.unroute('**/googleapis.com/youtube/v3/search*');
  await page.unroute('**/googleapis.com/youtube/v3/channels*');
  console.log('[Mock] YouTube API mocking disabled');
}
