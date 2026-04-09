import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("「プロが教える家庭料理」のレビューを確認します...\n");

  // チャンネルを検索
  const { data: channels } = await supabase
    .from("channels")
    .select("id, title, youtube_channel_id")
    .ilike("title", `%papa%cooking%`);

  if (!channels || channels.length === 0) {
    console.log("❌ チャンネルが見つかりません");
    process.exit(1);
  }

  const channel = channels[0];
  console.log(`チャンネル: ${channel.title}`);
  console.log(`ID: ${channel.id}\n`);

  // レビューを取得（usersとの結合なし）
  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select("id, rating, title, content, user_id, created_at")
    .eq("channel_id", channel.id)
    .order("created_at", { ascending: false });

  if (reviewError) {
    console.error("レビュー取得エラー:", reviewError);
    process.exit(1);
  }

  if (!reviews || reviews.length === 0) {
    console.log("⚠️  レビューがありません");
    console.log("\nレビューを追加します...\n");

    // 3件のレビューを追加
    const reviewsToAdd = [
      {
        user_id: "11111111-1111-1111-1111-111111111111",
        channel_id: channel.id,
        rating: 5,
        title: "プロのレシピが学べる",
        content:
          "プロの料理人のテクニックが家庭でも再現できる形で紹介されていて、とても参考になります。",
        helpful_count: 15,
      },
      {
        user_id: "22222222-2222-2222-2222-222222222222",
        channel_id: channel.id,
        rating: 4,
        title: "分かりやすい説明",
        content: "料理の工程が丁寧に説明されていて、初心者でも作りやすいです。",
        helpful_count: 10,
      },
      {
        user_id: "33333333-3333-3333-3333-333333333333",
        channel_id: channel.id,
        rating: 5,
        title: "家庭料理の質が上がった",
        content:
          "このチャンネルを見てから、家族から料理が美味しくなったと言われるようになりました。",
        helpful_count: 8,
      },
    ];

    let successCount = 0;
    for (const review of reviewsToAdd) {
      const { error: insertError } = await supabase
        .from("reviews")
        .insert(review);

      if (insertError) {
        console.error(`❌ エラー:`, insertError.message);
      } else {
        successCount++;
      }
    }

    console.log(`✅ ${successCount}件のレビューを追加しました`);
  } else {
    console.log(`✅ レビュー: ${reviews.length}件\n`);
    reviews.forEach((review, index) => {
      console.log(`${index + 1}. ★${review.rating} - ${review.title}`);
      console.log(`   ${review.content.substring(0, 60)}...`);
      console.log("");
    });
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
