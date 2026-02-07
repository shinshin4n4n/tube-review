import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import ListDetailClient from './list-detail-client';
import { BackButton } from '@/components/ui/back-button';

export const metadata: Metadata = {
  title: 'リスト詳細 | TubeReview',
  description: 'カスタムリストの詳細',
};

type ListDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * リスト詳細ページ
 */
export default async function ListDetailPage({ params }: ListDetailPageProps) {
  // 認証チェック
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Supabaseクライアント作成
  const supabase = await createClient();

  // リスト取得
  const { data: list, error: listError } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (listError || !list) {
    notFound();
  }

  return (
    <Layout>
      <BackButton />

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content mb-2">{list.title}</h1>
          {list.description && (
            <p className="text-content-secondary">{list.description}</p>
          )}
          {list.is_public && (
            <span className="inline-block mt-2 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
              公開リスト
            </span>
          )}
        </div>

        <ListDetailClient listId={id} />
      </div>
    </Layout>
  );
}
