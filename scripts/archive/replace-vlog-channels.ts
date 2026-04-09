import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

// 実在するVLOG系チャンネル
const realVlogChannels = [
  {
    oldId: "cb111111-1111-1111-1111-111111111111", // バイリンガール英会話
    youtubeChannelId: "UCHL9bfHTxCMi-7vfxQ-AYtg", // Abroad in Japan
  },
  {
    oldId: "cb222222-2222-2222-2222-222222222222", // ひかりんちょ
    youtubeChannelId: "UC4yqcgz49APdbgj0OMv7jpA", // Rachel and Jun
  },
  {
    oldId: "cb444444-4444-4444-4444-444444444444", // AKIOの東京チャンネル
    youtubeChannelId: "UCqwxJts-6yF33rupyF_DCsA", // Life Where I'm From
  },
  {
    oldId: "cb555555-5555-5555-5555-555555555555", // かおるTV
    youtubeChannelId: "UC78cxCAcp7JfQPgKxYdyGrg", // emma chamberlain
  },
];

interface ChannelInfo {
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  publishedAt: string;
}

async function getChannelInfo(
  youtubeChannelId: string
): Promise<ChannelInfo | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${youtubeChannelId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        publishedAt: channel.snippet.publishedAt,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching channel info: ${(error as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("VLOGチャンネルを実在するチャンネルに置き換えます...\n");

  for (const channel of realVlogChannels) {
    console.log(`処理中: ${channel.oldId}`);

    // YouTube APIからチャンネル情報を取得
    const info = await getChannelInfo(channel.youtubeChannelId);

    if (info) {
      console.log(`  取得: ${info.title}`);
      console.log(`  登録者: ${info.subscriberCount.toLocaleString()}人`);

      // データベースを更新
      const { error } = await supabase
        .from("channels")
        .update({
          youtube_channel_id: channel.youtubeChannelId,
          title: info.title,
          description: info.description,
          thumbnail_url: info.thumbnailUrl,
          subscriber_count: info.subscriberCount,
          video_count: info.videoCount,
          published_at: info.publishedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", channel.oldId);

      if (error) {
        console.error(`  ❌ 更新エラー: ${error.message}`);
      } else {
        console.log(`  ✅ 更新完了`);
      }
    } else {
      console.log(`  ❌ チャンネル情報取得失敗`);
    }

    console.log("");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("すべてのVLOGチャンネルを更新しました！");
  console.log("\n更新されたチャンネル:");

  const { data: updatedChannels } = await supabase
    .from("channels")
    .select("title, subscriber_count")
    .eq("category", "vlog")
    .order("subscriber_count", { ascending: false });

  updatedChannels?.forEach((ch, index) => {
    console.log(
      `  ${index + 1}. ${ch.title} (${ch.subscriber_count?.toLocaleString()}人)`
    );
  });
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
