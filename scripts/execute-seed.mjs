#!/usr/bin/env node

/**
 * シードデータ実行スクリプト (Direct PostgreSQL接続版)
 * pgパッケージを使用してseed.sqlを実行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 環境変数の読み込み
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL must be set in .env.local');
  process.exit(1);
}

// Supabase URLからプロジェクトIDを取得
const projectRef = supabaseUrl.split('//')[1].split('.')[0];

// PostgreSQL接続文字列を構築
const connectionString = supabasePassword
  ? `postgresql://postgres:${supabasePassword}@db.${projectRef}.supabase.co:5432/postgres`
  : `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:6543/postgres`;

async function executeSeed() {
  console.log('🌱 Seed Data Execution Tool (Direct PostgreSQL)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // seed.sqlファイルを読み込み
  const seedPath = path.join(__dirname, '../supabase/seed.sql');

  if (!fs.existsSync(seedPath)) {
    console.error('❌ Error: seed.sql not found at:', seedPath);
    process.exit(1);
  }

  const seedSQL = fs.readFileSync(seedPath, 'utf-8');
  console.log(`📄 Loaded: supabase/seed.sql (${(seedSQL.length / 1024).toFixed(2)} KB)\n`);

  console.log('🔌 Connecting to remote database...\n');

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    console.log('🚀 Executing seed data...\n');
    await client.query(seedSQL);

    console.log('✅ Seed data executed successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Error executing seed data:\n');
    console.error(err.message);
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // エラーの詳細を表示
    if (err.detail) {
      console.error('Detail:', err.detail);
    }
    if (err.hint) {
      console.error('Hint:', err.hint);
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

// 実行
executeSeed().catch(console.error);
