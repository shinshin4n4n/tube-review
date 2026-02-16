import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applySeed() {
  console.log("🚀 seed.sqlを適用します...\n");

  try {
    // 1. 既存データを削除
    console.log("📝 既存データを削除中...");

    const tables = [
      "review_helpful",
      "review_reports",
      "reviews",
      "list_channels",
      "list_likes",
      "lists",
      "user_channels",
      "top_videos",
      "channels",
      "user_follows",
      "user_settings",
      "users",
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows to delete
        console.log(`  ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}`);
      }
    }

    console.log("\n✅ 既存データの削除が完了しました");
    console.log("\n📝 次のステップ:");
    console.log(
      "  1. Supabase Studio (https://supabase.com/dashboard)にアクセス"
    );
    console.log("  2. SQL Editorを開く");
    console.log("  3. supabase/seed.sqlの内容をコピー＆ペースト");
    console.log("  4. 実行ボタンをクリック");
    console.log("\n💡 seed.sqlの場所: supabase/seed.sql");
  } catch (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }
}

applySeed().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
