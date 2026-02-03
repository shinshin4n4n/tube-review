import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ProfileView } from '@/app/_components/profile-view';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プロフィール | TubeReview',
  description: 'ユーザープロフィール',
};

export default async function ProfilePage() {
  // 認証チェック
  const user = await requireAuth();

  // Supabaseクライアント作成
  const supabase = await createClient();

  // RLSポリシーにより、自分のデータのみ取得可能
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, username, display_name, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Failed to fetch profile:', error);
    redirect('/login');
  }

  return <ProfileView profile={profile} />;
}
