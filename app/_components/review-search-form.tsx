"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants/categories";
import type { ReviewSortType } from "@/lib/types/ranking";

interface ReviewSearchFormProps {
  initialQuery?: string;
  initialSort?: ReviewSortType;
  initialCategory?: string;
  initialRating?: string;
}

/**
 * レビュー検索・フィルタリングフォーム
 * URL searchParams ベースでフィルタ状態を管理
 */
export function ReviewSearchForm({
  initialQuery = "",
  initialSort = "recent",
  initialCategory = "",
  initialRating = "",
}: ReviewSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * searchParams を更新して遷移する共通関数
   * フィルタ変更時は page=1 にリセット
   */
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams);
      // ページをリセット
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const queryString = params.toString();
      router.push(queryString ? `/reviews?${queryString}` : "/reviews");
    },
    [router, searchParams]
  );

  /** キーワード検索の送信 */
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = (formData.get("q") as string)?.trim() || "";

    if (query.length > 100) {
      return;
    }

    updateParams({ q: query });
  };

  /** 並び順の変更 */
  const handleSortChange = (sortType: ReviewSortType) => {
    updateParams({ sort: sortType === "recent" ? "" : sortType });
  };

  /** カテゴリの変更 */
  const handleCategoryChange = (value: string) => {
    updateParams({ category: value === "all" ? "" : value });
  };

  /** 評価の変更 */
  const handleRatingChange = (value: string) => {
    updateParams({ rating: value === "all" ? "" : value });
  };

  /** フィルタをすべてリセット */
  const handleReset = () => {
    router.push("/reviews");
  };

  const hasActiveFilters =
    initialQuery ||
    initialSort !== "recent" ||
    initialCategory ||
    initialRating;

  return (
    <div className="space-y-4" data-testid="review-search-form">
      {/* キーワード検索 */}
      <form onSubmit={handleSearchSubmit}>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              name="q"
              placeholder="レビューを検索（タイトル・本文・チャンネル名）..."
              defaultValue={initialQuery}
              className="h-11"
              data-testid="review-search-input"
              maxLength={100}
            />
          </div>
          <Button
            type="submit"
            className="h-11 px-5"
            data-testid="review-search-button"
          >
            <Search className="mr-1.5 h-4 w-4" />
            検索
          </Button>
        </div>
      </form>

      {/* フィルタ・ソート */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 並び順 */}
        <div className="flex items-center gap-2">
          <span className="text-content-secondary text-sm whitespace-nowrap">
            並び替え:
          </span>
          <div className="flex gap-1.5">
            <SortButton
              active={initialSort === "recent"}
              onClick={() => handleSortChange("recent")}
            >
              新着順
            </SortButton>
            <SortButton
              active={initialSort === "helpful"}
              onClick={() => handleSortChange("helpful")}
            >
              参考になった順
            </SortButton>
          </div>
        </div>

        {/* カテゴリ */}
        <div className="flex items-center gap-2">
          <span className="text-content-secondary text-sm whitespace-nowrap">
            カテゴリ:
          </span>
          <Select
            value={initialCategory || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger
              className="h-9 w-[160px]"
              data-testid="review-category-select"
            >
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 評価 */}
        <div className="flex items-center gap-2">
          <span className="text-content-secondary text-sm whitespace-nowrap">
            評価:
          </span>
          <Select
            value={initialRating || "all"}
            onValueChange={handleRatingChange}
          >
            <SelectTrigger
              className="h-9 w-[120px]"
              data-testid="review-rating-select"
            >
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="5">★★★★★</SelectItem>
              <SelectItem value="4">★★★★☆</SelectItem>
              <SelectItem value="3">★★★☆☆</SelectItem>
              <SelectItem value="2">★★☆☆☆</SelectItem>
              <SelectItem value="1">★☆☆☆☆</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* リセット */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-content-secondary hover:text-content"
            data-testid="review-search-reset"
          >
            <X className="mr-1 h-4 w-4" />
            リセット
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 並び順ボタン
 */
function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "border-stroke bg-surface text-content hover:bg-surface-hover"
      }`}
      data-testid={`sort-button-${active ? "active" : "inactive"}`}
    >
      {children}
    </button>
  );
}
