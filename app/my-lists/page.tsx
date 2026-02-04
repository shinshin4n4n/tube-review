import { redirect } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getUser } from '@/lib/auth';
import { getMyListsAction } from '@/app/_actions/list';
import MyListsClient from './my-lists-client';

export const metadata = {
  title: 'マイリスト | TubeReview',
  description: 'チャンネルをグループ化して管理',
};

/**
 * マイリスト管理ページ
 */
export default async function MyListsPage() {
  // 認証チェック
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // リスト取得
  const listsResponse = await getMyListsAction(1, 20);
  const listsData = listsResponse.success ? listsResponse.data : null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-content mb-2">マイリスト</h1>
          <p className="text-content-secondary">
            チャンネルをテーマ別にグループ化して管理できます
          </p>
        </div>

        {listsData ? (
          <MyListsClient initialData={listsData} userId={user.id} />
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500">リストの取得に失敗しました</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
