import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("カテゴリー別チャンネル一覧\n");
  console.log("=".repeat(60));

  const { data: channels, error } = await supabase
    .from("channels")
    .select("title, category")
    .order("category")
    .order("title");

  if (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }

  const categoryMap: Record<string, string> = {
    entertainment: "エンタメ",
    education: "教育",
    cooking: "料理",
    vlog: "Vlog",
    lifestyle: "ライフスタイル",
    gaming: "ゲーム",
    music: "音楽",
    tech: "テクノロジー",
    sports: "スポーツ",
    news: "ニュース",
    travel: "旅行",
  };

  let currentCategory: string | null = null;
  const categoryCount: Record<string, number> = {};

  channels.forEach((channel) => {
    const category = channel.category;
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    if (currentCategory !== category) {
      if (currentCategory !== null) {
        console.log("");
      }
      currentCategory = category;
      console.log(`\n【${categoryMap[category] || category}】 (${category})`);
      console.log("-".repeat(60));
    }
    console.log(`  • ${channel.title}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("\n【カテゴリー別集計】");
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(
        `  ${categoryMap[category] || category} (${category}): ${count}チャンネル`
      );
    });
  console.log("\n合計: " + channels.length + "チャンネル");
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
