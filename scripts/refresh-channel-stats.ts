/**
 * チャンネル統計情報の実体化ビューをリフレッシュ
 *
 * 使用方法:
 * node scripts/refresh-channel-stats.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 環境変数が設定されていません");
  console.error(
    "必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshChannelStats() {
  console.log("🔄 チャンネル統計情報の実体化ビューをリフレッシュ中...");

  try {
    // 実体化ビューをリフレッシュ
    const { error } = await supabase.rpc("refresh_materialized_view", {
      view_name: "channel_stats",
    });

    if (error) {
      // RPCが存在しない場合は直接SQLを実行
      console.log("⚠️  RPC関数が見つかりません。直接SQLを実行します...");

      const { error: sqlError } = await supabase
        .from("channel_stats")
        .select("count")
        .limit(0); // ダミークエリ（実際にはSQLで直接実行が必要）

      if (sqlError) {
        throw new Error(`SQLエラー: ${sqlError.message}`);
      }

      console.log(
        "⚠️  Supabase Dashboardから以下のSQLを手動で実行してください:"
      );
      console.log("");
      console.log("  REFRESH MATERIALIZED VIEW channel_stats;");
      console.log("");
      return;
    }

    console.log("✅ 実体化ビューのリフレッシュが完了しました");

    // 統計情報を表示
    const { data: stats, error: statsError } = await supabase
      .from("channel_stats")
      .select("*")
      .limit(1);

    if (!statsError && stats) {
      console.log(
        `📊 統計情報が更新されました (最終更新: ${stats[0]?.updated_at || "N/A"})`
      );
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// メイン処理を実行
refreshChannelStats().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
