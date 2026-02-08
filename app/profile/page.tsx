import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Layout } from '@/components/layout';
import { ProfileView } from '@/app/_components/profile-view';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ProfileBreadcrumb } from '@/app/_components/profile-breadcrumb';

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
    .select('id, email, username, display_name, avatar_url, bio, occupation, gender, birth_date, prefecture, website_url, created_at')
    .eq('id', user.id)
    .single();

  // プロフィールが存在しない場合は自動作成
  if (error || !profile) {
    console.log('Profile not found, creating...', { userId: user.id, error });

    // メールアドレスからユーザー名を生成
    const baseUsername = user.email?.split('@')[0] || 'user';
    let username = baseUsername;
    let counter = 0;

    // ユーザー名の重複チェック
    let usernameExists = true;
    while (usernameExists) {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (!data) {
        usernameExists = false;
      } else {
        counter++;
        username = `${baseUsername}${counter}`;
      }
    }

    // プロフィールを作成
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        username,
        display_name: user.user_metadata?.name || user.user_metadata?.full_name || username,
        avatar_url: user.user_metadata?.avatar_url,
      })
      .select('id, email, username, display_name, avatar_url, bio, occupation, gender, birth_date, prefecture, website_url, created_at')
      .single();

    if (createError) {
      console.error('Failed to create profile:', createError);
      redirect('/login');
    }

    profile = newProfile;

    // デフォルトのユーザー設定も作成
    await supabase.from('user_settings').insert({
      user_id: user.id,
      is_public: true,
      email_notifications: true,
      preferences: {},
    });
  }

  return (
    <Layout>
      {/* ブレッドクラム */}
      <div className="mb-4">
        <ProfileBreadcrumb />
      </div>

      <ProfileView profile={profile} />
    </Layout>
  );
}
