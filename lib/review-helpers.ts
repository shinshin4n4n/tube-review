import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReviewWithUser } from "@/lib/types/review";

/**
 * ログインユーザーの「参考になった」投票済みレビューIDセットを取得する
 *
 * @param supabase Supabaseクライアント
 * @param userId ユーザーID
 * @param reviewIds 対象レビューIDの配列
 * @returns 投票済みレビューIDのSet
 */
export async function fetchUserHelpfulVotes(
  supabase: SupabaseClient,
  userId: string,
  reviewIds: string[]
): Promise<Set<string>> {
  if (reviewIds.length === 0) {
    return new Set();
  }

  const { data: helpfulData } = await supabase
    .from("review_helpful")
    .select("review_id")
    .in("review_id", reviewIds)
    .eq("user_id", userId);

  if (!helpfulData) {
    return new Set();
  }

  return new Set(helpfulData.map((h) => h.review_id));
}

/**
 * Supabaseから取得したレビューデータをReviewWithUser型に変換する
 *
 * Supabase JOINの結果、userが配列になる場合があるため単一オブジェクトに変換し、
 * is_helpfulフラグを付与する。
 *
 * @param reviews Supabaseから取得した生のレビューデータ
 * @param userHelpfulVotes ユーザーの投票済みレビューIDセット
 * @returns 変換後のReviewWithUser配列
 */
export function transformReviewsWithUser(
  reviews: Array<{
    id: string;
    user:
      | {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        }
      | Array<{
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        }>;
    [key: string]: unknown;
  }>,
  userHelpfulVotes: Set<string>
): ReviewWithUser[] {
  return reviews.map((review) => {
    const reviewUser = Array.isArray(review.user)
      ? review.user[0]
      : review.user;
    return {
      ...review,
      user: reviewUser,
      is_helpful: userHelpfulVotes.has(review.id),
    } as ReviewWithUser;
  });
}
