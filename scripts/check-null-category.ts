import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from("channels")
    .select("id, title, youtube_channel_id, category")
    .is("category", null);

  if (error) {
    console.log("❌ エラー:", error.message);
    process.exit(1);
  } else if (!data || data.length === 0) {
    console.log("✅ カテゴリーがnullのチャンネルはありません");
  } else {
    console.log(`⚠️  カテゴリーがnullのチャンネル (${data.length}件):`);
    data.forEach((c) =>
      console.log(
        `   - ${c.title} (ID: ${c.id}, YouTube ID: ${c.youtube_channel_id})`
      )
    );
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
