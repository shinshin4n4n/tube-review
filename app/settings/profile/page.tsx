import { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ProfileEditForm } from '@/app/_components/profile/ProfileEditForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'プロフィール編集 | TubeReview',
  description: 'プロフィール情報を編集',
};

/**
 * プロフィール編集ページ
 */
export default async function ProfileEditPage() {
  // 認証必須
  const user = await requireAuth();

  // Supabaseクライアント作成
  const supabase = await createClient();

  // プロフィール情報を取得
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    throw new Error('プロフィール情報の取得に失敗しました');
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">プロフィール編集</CardTitle>
          <CardDescription>
            あなたのプロフィール情報を編集できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
