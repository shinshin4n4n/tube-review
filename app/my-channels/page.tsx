import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Layout } from '@/components/layout';
import { getUser } from '@/lib/auth';
import MyChannelsClient from './my-channels-client';

export const metadata: Metadata = {
  title: 'マイチャンネル | TubeReview',
  description: '視聴管理、カスタムリスト、マイれびゅ!を管理',
};

type MyChannelsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

/**
 * マイチャンネルページ
 * 視聴管理、カスタムリスト、マイれびゅ!を統合
 */
export default async function MyChannelsPage({
  searchParams,
}: MyChannelsPageProps) {
  // 認証チェック
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // クエリパラメータを解決
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab || 'watching';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-content mb-2">マイチャンネル</h1>
        <p className="text-content-secondary mb-8">
          視聴管理、カスタムリスト、マイれびゅ!
        </p>

        <MyChannelsClient initialTab={tab} />
      </div>
    </Layout>
  );
}
