import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from("channels")
    .select("id, title, youtube_channel_id")
    .limit(5);

  if (error) {
    console.log("❌ エラー:", error.message);
    console.log("💡 seed.sqlを実行してください");
    process.exit(1);
  } else if (!data || data.length === 0) {
    console.log("⚠️  チャンネルデータが見つかりません");
    console.log("💡 seed.sqlを実行してください:");
    console.log("   npx supabase db reset");
    process.exit(1);
  } else {
    console.log(`✅ チャンネルデータが存在します (${data.length}件確認)`);
    data.forEach((c) =>
      console.log(`   - ${c.title} (${c.youtube_channel_id})`)
    );
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
