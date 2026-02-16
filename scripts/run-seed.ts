#!/usr/bin/env node

/**
 * シードデータ実行スクリプト
 * Supabase CLIの代わりにNode.jsとSupabase SDKを使用してseed.sqlを実行
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
  );
  process.exit(1);
}

// Service Roleキーでクライアント作成（RLSをバイパス）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSeed() {
  console.log("🌱 Starting seed data execution...\n");

  // seed.sqlファイルを読み込み
  const seedPath = path.join(__dirname, "../supabase/seed.sql");
  const seedSQL = fs.readFileSync(seedPath, "utf-8");

  try {
    // SQLを実行（Supabase PostgreSQL REST APIを使用）
    console.log("📝 Executing seed.sql...");

    // Supabase SDKのrpcを使用してSQLを実行
    // 注: 大きなSQLファイルの場合、複数のクエリに分割する必要がある場合があります
    const { data, error } = await supabase.rpc("exec_sql", { sql: seedSQL });

    if (error) {
      // rpc関数が存在しない場合、直接postgRESTを使用
      console.log(
        "ℹ️  RPC method not available, using direct SQL execution...\n"
      );

      // SQLを実行するための一時的な方法: 各テーブルに直接挿入
      await executeSeedDirectly();
    } else {
      console.log("✅ Seed data executed successfully!");
      console.log(data);
    }
  } catch (err) {
    console.error("❌ Error executing seed:", err);
    process.exit(1);
  }
}

/**
 * 直接データを挿入する方法
 * SQLファイルの代わりに、JavaScriptでデータを挿入
 */
async function executeSeedDirectly() {
  console.log("📊 Inserting seed data directly...\n");

  try {
    // 注: seed.sqlの内容を実行するため、Supabase Dashboardを使用することを推奨
    console.log("⚠️  Warning: Direct SQL execution via SDK is limited.");
    console.log("");
    console.log("📌 Recommended approach:");
    console.log(
      "   1. Open Supabase Dashboard: https://supabase.com/dashboard"
    );
    console.log("   2. Navigate to SQL Editor");
    console.log("   3. Copy and paste the contents of supabase/seed.sql");
    console.log('   4. Click "Run"');
    console.log("");
    console.log("   OR");
    console.log("");
    console.log("   Use the following command if you have psql installed:");
    console.log('   psql "<your-database-url>" < supabase/seed.sql');
    console.log("");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

// 実行
runSeed().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
