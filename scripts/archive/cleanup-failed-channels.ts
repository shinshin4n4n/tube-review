import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const failedChannelIds = [
  "UCdR31cNNYIlNSf4gUSKjNbw", // フィッシャーズ
  "UCiQuE3kKCQyJmGjiEZ22ZPw", // QuizKnock
  "UCaC1MG2mjaKzz3TSBnYM7hQ", // カズレーザーのYouTubeラボ
  "UCVu1rCnuKNw1ieQUa14TFdw", // NHK
  "UCrOZgGwfcgIJ3f3xUhQKJEg", // 両学長 リベラルアーツ大学
  "UCpnvhOIJ6BN-npM-v3JglAg", // 兄者弟者
  "UCZYyGEWkCHLBG-NaVbHCi5w", // きまぐれクック
  "UCxjFbkjYo1o2fPWgKRXqiAA", // すしらーめん《りく》
];

async function main() {
  console.log("🗑️  失敗したチャンネルを削除します...\n");

  for (const youtubeChannelId of failedChannelIds) {
    // チャンネル名を取得
    const { data: channel } = await supabase
      .from("channels")
      .select("title")
      .eq("youtube_channel_id", youtubeChannelId)
      .single();

    if (channel) {
      // 削除実行（カスケード削除により関連データも削除される）
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("youtube_channel_id", youtubeChannelId);

      if (error) {
        console.log(`❌ 削除失敗: ${channel.title} - ${error.message}`);
      } else {
        console.log(`✅ 削除成功: ${channel.title}`);
      }
    }
  }

  console.log("\n✨ 削除が完了しました！");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
