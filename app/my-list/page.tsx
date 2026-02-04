import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getUser } from '@/lib/auth';
import { getMyListAction } from '@/app/_actions/user-channel';
import MyListClient from './my-list-client';

export const metadata: Metadata = {
  title: 'マイリスト | TubeReview',
  description: '自分のマイリストを管理',
};

type MyListPageProps = {
  searchParams: Promise<{ status?: string }>;
};

/**
 * マイリストページ
 */
export default async function MyListPage({ searchParams }: MyListPageProps) {
  // 認証チェック
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // クエリパラメータを解決
  const resolvedSearchParams = await searchParams;
  const statusParam = resolvedSearchParams.status;

  // ステータスフィルタの検証
  const validStatuses = ['want', 'watching', 'watched'];
  const status =
    statusParam && validStatuses.includes(statusParam)
      ? (statusParam as 'want' | 'watching' | 'watched')
      : undefined;

  // マイリスト取得
  const result = await getMyListAction(status);

  if (!result.success) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-content mb-8">マイリスト</h1>
          <p className="text-red-600">
            {result.error || 'マイリストの取得に失敗しました'}
          </p>
        </div>
      </Layout>
    );
  }

  const items = result.data;

  // ステータス別カウント
  const stats = {
    all: items.length,
    want: items.filter((item) => item.status === 'want').length,
    watching: items.filter((item) => item.status === 'watching').length,
    watched: items.filter((item) => item.status === 'watched').length,
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-content mb-2">マイリスト</h1>
        <p className="text-content-secondary mb-8">
          合計 {stats.all} チャンネル
        </p>

        <MyListClient items={items} stats={stats} currentStatus={status} />
      </div>
    </Layout>
  );
}
