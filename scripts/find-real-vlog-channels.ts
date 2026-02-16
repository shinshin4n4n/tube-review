import "dotenv/config";
import fs from "fs";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

// 実在する日本のVLOG系YouTubeチャンネル候補
const vlogChannelCandidates = [
  {
    name: "バイリンガール英会話 | Bilingirl Chika",
    id: "UC-9JT8hBJv1FO0oegAK7kkw",
  },
  { name: "OKUDAIRA BASE", id: "UCjr17WiVYUqtRi2eZBcAZSg" },
  { name: "Peaceful Cuisine", id: "UCQHNNY-FL4hb1N8hYpIohqQ" },
  { name: "ひなちゃんねる", id: "UCyC1uA5e68bfKgv-e4xnb5w" },
  { name: "Ghib Ojisan", id: "UCii8SWzKXGQl-H-XJ45mXjQ" },
  { name: "Rachel and Jun", id: "UC4yqcgz49APdbgj0OMv7jpA" },
  { name: "Life Where I'm From", id: "UCqwxJts-6yF33rupyF_DCsA" },
  { name: "abroad in japan", id: "UCHL9bfHTxCMi-7vfxQ-AYtg" },
];

interface ChannelResult {
  valid: boolean;
  name: string;
  youtubeTitle?: string;
  channelId: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  publishedAt?: string;
  error?: string;
}

async function checkChannel(
  channelId: string,
  name: string
): Promise<ChannelResult> {
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
        description: channel.snippet.description.substring(0, 150) + "...",
        thumbnailUrl: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        publishedAt: channel.snippet.publishedAt,
      };
    } else {
      return {
        valid: false,
        name,
        channelId,
        error: "チャンネルが見つかりません",
      };
    }
  } catch (error) {
    return { valid: false, name, channelId, error: (error as Error).message };
  }
}

async function main() {
  console.log("実在するVLOG系YouTubeチャンネルを確認中...\n");

  const validChannels: ChannelResult[] = [];

  for (const candidate of vlogChannelCandidates) {
    console.log(`確認中: ${candidate.name}`);
    const result = await checkChannel(candidate.id, candidate.name);

    if (result.valid) {
      console.log(`  ✅ 有効 - ${result.youtubeTitle}`);
      console.log(`     登録者: ${result.subscriberCount?.toLocaleString()}人`);
      validChannels.push(result);
    } else {
      console.log(`  ❌ 無効 - ${result.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n\n有効なチャンネル: ${validChannels.length}件\n`);
  console.log("=".repeat(80));

  // 上位5つのチャンネルを選択（登録者数順）
  const topChannels = validChannels
    .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
    .slice(0, 5);

  console.log("\n推奨するVLOG系チャンネル（登録者数順）:\n");

  topChannels.forEach((channel, index) => {
    console.log(`${index + 1}. ${channel.youtubeTitle}`);
    console.log(`   Channel ID: ${channel.channelId}`);
    console.log(`   登録者数: ${channel.subscriberCount?.toLocaleString()}人`);
    console.log(`   動画数: ${channel.videoCount?.toLocaleString()}本`);
    console.log(`   説明: ${channel.description}`);
    console.log("");
  });

  // JSONファイルに保存
  const outputPath = "scripts/vlog-channels.json";
  fs.writeFileSync(outputPath, JSON.stringify(topChannels, null, 2));
  console.log(`✅ チャンネル情報を ${outputPath} に保存しました`);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
