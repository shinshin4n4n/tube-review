#!/usr/bin/env node

/**
 * シードデータ実行スクリプト
 * Supabase Management APIを使用してseed.sqlを実行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// プロジェクトIDを取得
const projectId = supabaseUrl.split('//')[1].split('.')[0];

async function executeSQLQuery(sql) {
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // RPC関数が存在しない場合は別の方法を試す
    return null;
  }

  return await response.json();
}

async function executeSQLViaPostgREST(sql) {
  // PostgreSQL REST API経由でSQLを実行
  // 注: これは直接的なSQL実行ではなく、データ挿入のみ可能

  console.log('ℹ️  Using Supabase SQL Editor is recommended for seed.sql execution\n');
  console.log('📌 Please follow these steps:');
  console.log('   1. Open: https://supabase.com/dashboard/project/' + projectId + '/sql');
  console.log('   2. Click "New query"');
  console.log('   3. Copy and paste the contents of: supabase/seed.sql');
  console.log('   4. Click "Run" or press Ctrl+Enter');
  console.log('');
  console.log('✨ The seed data will be inserted into your database.\n');
}

async function runSeed() {
  console.log('🌱 Seed Data Execution Tool\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // seed.sqlファイルを読み込み
  const seedPath = path.join(__dirname, '../supabase/seed.sql');

  if (!fs.existsSync(seedPath)) {
    console.error('❌ Error: seed.sql not found at:', seedPath);
    process.exit(1);
  }

  const seedSQL = fs.readFileSync(seedPath, 'utf-8');
  console.log(`📄 Loaded: supabase/seed.sql (${(seedSQL.length / 1024).toFixed(2)} KB)\n`);

  try {
    // SQL実行を試みる
    const result = await executeSQLQuery(seedSQL);

    if (result === null) {
      // RPC経由での実行が失敗した場合、代替方法を提示
      await executeSQLViaPostgREST(seedSQL);
    } else {
      console.log('✅ Seed data executed successfully!');
    }
  } catch (err) {
    console.error('⚠️  Direct SQL execution via API is not available.\n');
    await executeSQLViaPostgREST(seedSQL);
  }
}

// 実行
runSeed().catch(console.error);
