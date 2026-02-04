import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { getChannelDetailsAction } from '@/app/_actions/youtube';
import { getChannelReviewsAction } from '@/app/_actions/review';
import { getMyChannelStatusAction } from '@/app/_actions/user-channel';
import { Users, Video, Eye, Calendar, MessageSquare } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { ReviewForm } from '@/app/_components/review-form';
import ReviewList from '@/app/_components/review-list';
import AddToListButton from '@/app/_components/add-to-list-button';

type ChannelDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

/**
 * メタデータ生成（SEO最適化）
 */
export async function generateMetadata({
  params,
}: ChannelDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getChannelDetailsAction(id);

  if (!result.success || !result.data) {
    return {
      title: 'チャンネルが見つかりません | TubeReview',
      description: '指定されたチャンネルが見つかりませんでした。',
    };
  }

  const channel = result.data;

  return {
    title: `${channel.title} | TubeReview`,
    description: channel.description || `${channel.title}のチャンネル詳細情報`,
    openGraph: {
      title: channel.title,
      description: channel.description || `${channel.title}のチャンネル詳細情報`,
      images: [
        {
          url: channel.thumbnailUrl,
          width: 800,
          height: 800,
          alt: channel.title,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: channel.title,
      description: channel.description || `${channel.title}のチャンネル詳細情報`,
      images: [channel.thumbnailUrl],
    },
  };
}

/**
 * ISR設定（24時間ごとに再生成）
 */
export const revalidate = 86400; // 24時間

/**
 * チャンネル詳細ページ
 */
export default async function ChannelDetailPage({
  params,
  searchParams,
}: ChannelDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;

  // チャンネル詳細を取得
  const result = await getChannelDetailsAction(id);

  // エラーハンドリング
  if (!result.success || !result.data) {
    notFound();
  }

  const channel = result.data;

  // ユーザー情報を取得（認証チェック）
  const user = await getUser();

  // ユーザーのチャンネルステータスを取得（マイリスト用）
  const statusResponse = await getMyChannelStatusAction(id);
  const currentStatus = statusResponse.success ? statusResponse.data : null;

  // レビュー一覧を取得
  const reviewsResponse = await getChannelReviewsAction(id, page, 10);
  const reviewsData = reviewsResponse.success ? reviewsResponse.data : null;

  // 数値フォーマット関数
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ja-JP');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* チャンネルヘッダー */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* サムネイル */}
              <div className="flex-shrink-0">
                <Image
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  width={176}
                  height={176}
                  className="rounded-full object-cover"
                  data-testid="channel-thumbnail"
                  unoptimized
                  priority
                />
              </div>

              {/* チャンネル情報 */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-3xl font-bold text-content mb-2"
                  data-testid="channel-name"
                >
                  {channel.title}
                </h1>

                {channel.customUrl && (
                  <p className="text-content-secondary mb-4">
                    @{channel.customUrl}
                  </p>
                )}

                {/* 統計情報 */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {/* 登録者数 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-content-secondary mb-1">
                      <Users className="w-5 h-5" />
                      <span className="text-sm">登録者数</span>
                    </div>
                    <p
                      className="text-2xl font-bold text-content"
                      data-testid="subscriber-count"
                    >
                      {formatNumber(channel.subscriberCount)}
                    </p>
                  </div>

                  {/* 動画数 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-content-secondary mb-1">
                      <Video className="w-5 h-5" />
                      <span className="text-sm">動画数</span>
                    </div>
                    <p
                      className="text-2xl font-bold text-content"
                      data-testid="video-count"
                    >
                      {formatNumber(channel.videoCount)}
                    </p>
                  </div>

                  {/* 総視聴回数 */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-content-secondary mb-1">
                      <Eye className="w-5 h-5" />
                      <span className="text-sm">総視聴回数</span>
                    </div>
                    <p
                      className="text-2xl font-bold text-content"
                      data-testid="view-count"
                    >
                      {formatNumber(channel.viewCount)}
                    </p>
                  </div>
                </div>

                {/* マイリスト追加ボタン */}
                {user && (
                  <div className="mt-6">
                    <AddToListButton
                      channelId={id}
                      currentStatus={currentStatus}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* チャンネル説明 */}
        {channel.description && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-content mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                チャンネル概要
              </h2>
              <p
                className="text-content whitespace-pre-wrap"
                data-testid="channel-description"
              >
                {channel.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* レビュー投稿セクション */}
        {user && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-content mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                レビューを投稿
              </h2>
              <ReviewForm channelId={channel.youtubeChannelId} />
            </CardContent>
          </Card>
        )}

        {/* レビュー一覧セクション */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-content mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              レビュー一覧
            </h2>
            {reviewsData ? (
              <ReviewList
                initialData={reviewsData}
                channelId={id}
                currentUserId={user?.id}
              />
            ) : (
              <p className="text-gray-500">レビューの取得に失敗しました</p>
            )}
          </CardContent>
        </Card>

        {/* YouTubeで見るボタン */}
        <div className="text-center">
          <a
            href={`https://www.youtube.com/channel/${channel.youtubeChannelId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            <Video className="w-5 h-5" />
            YouTubeで見る
          </a>
        </div>
      </div>
    </Layout>
  );
}
