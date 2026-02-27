import { Suspense } from "react";
import { Layout } from "@/components/layout";
import { RecentReviews } from "@/app/_components/recent-reviews";
import { ReviewSearchForm } from "@/app/_components/review-search-form";
import { getRecentReviews } from "@/app/_actions/ranking";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { ReviewSortType } from "@/lib/types/ranking";

export const metadata = {
  title: "すべてのレビュー | TubeReview",
  description: "レビューを検索・フィルタリングして閲覧できます",
};

type ReviewsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    sort?: string;
    category?: string;
    rating?: string;
  }>;
};

/**
 * レビュー一覧ページ
 * 検索・フィルタリング・ページネーション対応
 */
export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const query = params.q?.trim() || "";
  const sort = (
    params.sort === "helpful" ? "helpful" : "recent"
  ) as ReviewSortType;
  const category = params.category || "";
  const rating = Number(params.rating) || undefined;

  // レビューを取得
  const data = await getRecentReviews({
    page,
    limit: 20,
    query: query || undefined,
    sort,
    category: category || undefined,
    rating,
  });

  // 日付を事前フォーマット
  const reviewsWithFormattedDates = data.reviews.map((review) => ({
    ...review,
    formattedDate: formatDistanceToNow(new Date(review.created_at), {
      addSuffix: true,
      locale: ja,
    }),
  }));

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        {/* ページタイトル */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="text-primary" size={32} />
            <h1 className="text-content text-3xl font-bold md:text-4xl">
              すべてのレビュー
            </h1>
          </div>
          <p className="text-content-secondary">
            ユーザーの投稿したレビューを検索・フィルタリングできます（全
            {data.pagination.total}件）
          </p>
        </div>

        {/* 検索・フィルタフォーム */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <ReviewSearchForm
              initialQuery={query}
              initialSort={sort}
              initialCategory={category}
              initialRating={rating?.toString() || ""}
            />
          </Suspense>
        </div>

        {/* レビュー一覧（見出し非表示） */}
        <RecentReviews
          reviews={reviewsWithFormattedDates}
          pagination={data.pagination}
          showHeader={false}
        />
      </div>
    </Layout>
  );
}
