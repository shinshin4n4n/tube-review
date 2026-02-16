import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

// カテゴリー別の検索キーワード
const searchQueries: Record<string, string[]> = {
  education: ["教育 チャンネル", "勉強 解説", "学習 大学"],
  cooking: ["料理 レシピ", "グルメ 飯テロ", "料理 作り方"],
  lifestyle: ["ライフスタイル vlog", "暮らし 日常", "ルーティン"],
  gaming: ["ゲーム実況", "ゲーム 配信", "ゲーム攻略"],
  music: ["音楽 歌ってみた", "ミュージック カバー", "歌 official"],
  tech: ["ガジェット レビュー", "テクノロジー IT", "スマホ パソコン"],
  sports: ["スポーツ 試合", "サッカー 野球", "スポーツニュース"],
  news: ["ニュース 報道", "ニュース 最新", "時事"],
  travel: ["旅行 観光", "旅 vlog", "世界一周"],
};

interface ChannelSearchResult {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

interface ChannelDetails {
  youtubeChannelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  publishedAt: string;
}

async function searchChannels(query: string): Promise<ChannelSearchResult[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=10&regionCode=JP&relevanceLanguage=ja&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items) {
      return data.items.map((item: any) => ({
        channelId: item.snippet.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.default?.url,
      }));
    }
    return [];
  } catch (error) {
    console.error(`Search error: ${(error as Error).message}`);
    return [];
  }
}

async function getChannelDetails(
  channelId: string
): Promise<ChannelDetails | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        youtubeChannelId: channelId,
        title: channel.snippet.title,
        description: channel.snippet.description || "",
        thumbnailUrl:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        publishedAt: channel.snippet.publishedAt,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function addChannel(
  category: string,
  channelInfo: ChannelDetails
): Promise<{ success: boolean; reason: string }> {
  // 既存チェック
  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("youtube_channel_id", channelInfo.youtubeChannelId)
    .single();

  if (existing) {
    return { success: false, reason: "already_exists" };
  }

  const { error } = await supabase.from("channels").insert({
    youtube_channel_id: channelInfo.youtubeChannelId,
    title: channelInfo.title,
    description: channelInfo.description.substring(0, 500),
    thumbnail_url: channelInfo.thumbnailUrl,
    subscriber_count: channelInfo.subscriberCount,
    video_count: channelInfo.videoCount,
    published_at: channelInfo.publishedAt,
    category: category,
  });

  return { success: !error, reason: error ? error.message : "success" };
}

async function main() {
  console.log("YouTube検索APIを使用してチャンネルを追加します...\n");

  const targetPerCategory = 4;
  const results: Record<string, { added: number; needed: number }> = {};

  for (const [category, queries] of Object.entries(searchQueries)) {
    console.log(`\n【${category}】カテゴリー`);
    console.log("=".repeat(50));

    // 現在のチャンネル数を確認
    const { count: currentCount } = await supabase
      .from("channels")
      .select("*", { count: "exact", head: true })
      .eq("category", category);

    const needed = targetPerCategory - (currentCount || 0);

    if (needed <= 0) {
      console.log(
        `  ✅ 既に${targetPerCategory}チャンネル以上登録されています`
      );
      results[category] = { added: 0, needed: 0 };
      continue;
    }

    console.log(`  目標: ${needed}チャンネル追加\n`);

    let added = 0;
    const maxAttempts = queries.length;

    for (let i = 0; i < maxAttempts && added < needed; i++) {
      const query = queries[i];
      console.log(`  検索: "${query}"`);

      const channels = await searchChannels(query);

      for (const ch of channels) {
        if (added >= needed) break;

        const details = await getChannelDetails(ch.channelId);

        if (details && details.subscriberCount >= 10000) {
          // 最低1万人登録者
          const result = await addChannel(category, details);

          if (result.success) {
            console.log(
              `    ✅ ${details.title} (${details.subscriberCount.toLocaleString()}人)`
            );
            added++;
          } else if (result.reason === "already_exists") {
            console.log(`    ⏭️  ${details.title} - 既存`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    results[category] = { added, needed };
    console.log(`  → ${added}/${needed}チャンネル追加`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("追加完了サマリー:\n");

  for (const [category, result] of Object.entries(results)) {
    const status = result.added >= result.needed ? "✅" : "⚠️";
    console.log(
      `${status} ${category}: ${result.added}/${result.needed}チャンネル追加`
    );
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
