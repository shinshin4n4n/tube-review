import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("ひかりんちょのチャンネル情報を確認します...\n");

  // タイトルで検索
  const { data: byTitle, error: titleError } = await supabase
    .from("channels")
    .select("*")
    .ilike("title", "%ひかりんちょ%");

  if (titleError) {
    console.error("❌ エラー:", titleError);
  } else if (byTitle && byTitle.length > 0) {
    console.log("✅ ひかりんちょのチャンネルが見つかりました:");
    byTitle.forEach((c) => {
      console.log(`  ID: ${c.id}`);
      console.log(`  Title: ${c.title}`);
      console.log(`  YouTube Channel ID: ${c.youtube_channel_id}`);
      console.log(`  Category: ${c.category}`);
      console.log("");
    });

    // チャンネル統計ビューでも確認
    const { data: withStats, error: statsError } = await supabase
      .from("channels_with_stats")
      .select("*")
      .eq("id", byTitle[0].id);

    if (statsError) {
      console.error("❌ 統計ビューエラー:", statsError);
    } else if (withStats && withStats.length > 0) {
      console.log("✅ channels_with_stats ビューにも存在します");
      console.log("  Review count:", withStats[0].review_count);
      console.log("  Average rating:", withStats[0].average_rating);
    } else {
      console.log("⚠️  channels_with_stats ビューには存在しません");
    }
  } else {
    console.log("⚠️  ひかりんちょのチャンネルが見つかりません");
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
