import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// カテゴリーマップ
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

async function main() {
  console.log("カテゴリー別チャンネル数を確認します...\n");

  const { data: channels, error } = await supabase
    .from("channels")
    .select("category");

  if (error) {
    console.error("エラー:", error);
    process.exit(1);
  }

  // カテゴリー別にカウント
  const counts: Record<string, number> = {};
  channels.forEach((ch) => {
    counts[ch.category] = (counts[ch.category] || 0) + 1;
  });

  console.log("現在のカテゴリー別チャンネル数:\n");
  console.log("カテゴリー".padEnd(20) + "現在  必要  不足");
  console.log("=".repeat(50));

  Object.keys(categoryMap).forEach((slug) => {
    const current = counts[slug] || 0;
    const needed = Math.max(0, 4 - current);
    const status = current >= 4 ? "✅" : "⚠️";
    console.log(
      `${status} ${categoryMap[slug]}`.padEnd(22) +
        `${current}     4     ${needed > 0 ? needed : "-"}`
    );
  });

  console.log("\n合計チャンネル数: " + channels.length);

  // 不足しているカテゴリーをリストアップ
  const neededCategories = Object.keys(categoryMap).filter((slug) => {
    const current = counts[slug] || 0;
    return current < 4;
  });

  if (neededCategories.length > 0) {
    console.log("\n追加が必要なカテゴリー:");
    neededCategories.forEach((slug) => {
      const current = counts[slug] || 0;
      const needed = 4 - current;
      console.log(
        `  - ${categoryMap[slug]} (${slug}): ${needed}チャンネル必要`
      );
    });
  } else {
    console.log("\n✅ すべてのカテゴリーに4チャンネル以上登録されています");
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
