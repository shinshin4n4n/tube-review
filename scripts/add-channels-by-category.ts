import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

// 実在する日本の人気YouTubeチャンネル（カテゴリー別）
const channelsToAdd = {
  education: [
    { id: "UCFo4kqllbcQ4nV83WCyraiw", name: "中田敦彦のYouTube大学" }, // 既存
    { id: "UCQ_MqAw18jFTlBB-f8BP7dw", name: "QuizKnock" }, // 既存
    { id: "UCYJ335HO_qLZDr7TywpI0Gg", name: "ヨビノリたくみ" },
    {
      id: "UCqovsNSzYPkUzsMX0qNwbYg",
      name: "予備校のノリで学ぶ「大学の数学・物理」",
    },
  ],
  cooking: [
    { id: "UCbCJmNKAL85O1VFeD6Wj60g", name: "Bayashi TV" }, // 既存
    { id: "UCaak9sggUeIBPOd8iK_BXcQ", name: "きまぐれクック" }, // 既存
    { id: "UC7_rOCIgLMzKu7-Z-uT4Y5g", name: "COCOCOROチャンネル" },
    { id: "UCVTdVgKPKbEH0sGEFvVwEww", name: "Party Kitchen" },
  ],
  lifestyle: [
    { id: "UCbfw7GknJp_F-AVvQsHmS0w", name: "ヒカル" }, // えつこは既存
    { id: "UCF8BSNlQ6FmtjdMNRm8MRCw", name: "SANALOG" },
    { id: "UCmZHVLIRlZjV_6ZTvQVxv9A", name: "ayana" },
    { id: "UCKlH-s3wrDI8JbLAWP7xNow", name: "Ghib Ojisan" },
  ],
  gaming: [
    { id: "UC5ZXcdQjRspFfDnVIvqQcsw", name: "ポッキー / pokken" },
    { id: "UCfQo2KXvZfQ7k5nfLAUqw0w", name: "加藤純一" },
    { id: "UCgMPP6RRjktV7krOfyUewqw", name: "はじめしゃちょー（hajime）" }, // ゲーム実況もする
    { id: "UCYmHFvVEJNGBWfB6cKNqKvA", name: "もこう" },
  ],
  music: [
    { id: "UCQ0OWvDKHqxJVf7AsFjpnUw", name: "THE FIRST TAKE" },
    { id: "UC8_wmm5DX9mb4jrLiw8ZYzw", name: "スカイピース" }, // 既存だが音楽系
    { id: "UCtiJy1qPYPOXDKXg8R2fJqA", name: "すとぷり" },
    { id: "UCUzJ-6rd7_P_rSsVdOW2Lfw", name: "Ado" },
  ],
  tech: [
    { id: "UCIFPZDbMFwDLPqMBcOx9vqA", name: "Appleが大好きなんだよ" },
    { id: "UCW0a8Rp7SHcX4_FzAmnSWRQ", name: "トバログ" },
    { id: "UCT10HJyZfQUZ-Ls5qGZL-Gg", name: "カズチャンネル/Kazu Channel" },
    { id: "UCGHHKUSSNhX45b_rngEeMUA", name: "せろりんね" },
  ],
  sports: [
    { id: "UC-JJ3vFOPbnXPLlKJ8KYmvA", name: "サッカー情報" },
    { id: "UCv38e6dNEzAmvVtou-PEPKg", name: "バスケットLIVE" },
    { id: "UCVLr_tgmPCH7hXnqBN-I_9w", name: "プロ野球実況" },
    { id: "UCJpbiIrDz4v59EbPpSZpEHw", name: "スポーツナビ" },
  ],
  news: [
    { id: "UCuTAXTexrhetbOe3zgskJBQ", name: "ANNnewsCH" },
    { id: "UCaRoeMJcC8fBJdYyNhtpY1g", name: "FNNプライムオンライン" },
    { id: "UCtViwU2_lXk_aC_nj08i4zw", name: "TBS NEWS DIG" },
    { id: "UCmQqNLmZdp_sH5HPTgs-y0A", name: "テレ東BIZ" },
  ],
  travel: [
    { id: "UCXQEHPep_6aQ9kITt4hwGnQ", name: "SUSURU TV" },
    { id: "UChlrKzm4MjqnPpkuWt5yW2g", name: "せやろがいおじさん" },
    { id: "UCHL9bfHTxCMi-7vfxQ-AYtg", name: "Abroad in Japan" }, // 既存だが旅行系でもある
    { id: "UC4yqcgz49APdbgj0OMv7jpA", name: "Rachel and Jun" }, // 既存だが旅行系でもある
  ],
};

async function getChannelInfo(youtubeChannelId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeChannelId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        youtubeChannelId: youtubeChannelId,
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
    console.error(
      `Error fetching ${youtubeChannelId}:`,
      (error as Error).message
    );
    return null;
  }
}

async function addChannel(
  category: string,
  channelInfo: {
    youtubeChannelId: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    subscriberCount: number;
    videoCount: number;
    publishedAt: string;
  }
) {
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

  return !error;
}

async function main() {
  console.log("カテゴリー別にチャンネルを追加します...\n");

  let addedCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [category, channels] of Object.entries(channelsToAdd)) {
    console.log(`\n【${category}】カテゴリー`);
    console.log("=".repeat(50));

    for (const ch of channels) {
      // 既存チェック
      const { data: existing } = await supabase
        .from("channels")
        .select("id")
        .eq("youtube_channel_id", ch.id)
        .single();

      if (existing) {
        console.log(`  ⏭️  ${ch.name} - 既に登録済み`);
        skipCount++;
        continue;
      }

      // YouTube APIから情報取得
      console.log(`  処理中: ${ch.name}`);
      const info = await getChannelInfo(ch.id);

      if (info) {
        const success = await addChannel(category, info);
        if (success) {
          console.log(
            `  ✅ 追加: ${info.title} (${info.subscriberCount.toLocaleString()}人)`
          );
          addedCount++;
        } else {
          console.log(`  ❌ 追加失敗`);
          errorCount++;
        }
      } else {
        console.log(`  ❌ チャンネル情報取得失敗`);
        errorCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("処理完了:");
  console.log(`  追加: ${addedCount}チャンネル`);
  console.log(`  スキップ: ${skipCount}チャンネル`);
  console.log(`  エラー: ${errorCount}チャンネル`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
