import { NextResponse } from 'next/server';

/**
 * 環境変数チェック用エンドポイント（デバッグ用）
 */
export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSiteUrl = !!process.env.NEXT_PUBLIC_SITE_URL;

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    supabaseUrl: hasSupabaseUrl
      ? process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      : 'NOT SET',
    supabaseAnonKey: hasSupabaseAnonKey ? 'SET (hidden)' : 'NOT SET',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
    allEnvVarsSet: hasSupabaseUrl && hasSupabaseAnonKey,
  });
}
