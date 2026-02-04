'use client';

import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

/**
 * ページネーションコンポーネント
 * 前へ・次へボタンとページ番号を表示します
 */
export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`${baseUrl}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => navigateToPage(currentPage - 1)}
        aria-label="前のページ"
      >
        前へ
      </Button>

      <span className="text-sm text-gray-600">
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => navigateToPage(currentPage + 1)}
        aria-label="次のページ"
      >
        次へ
      </Button>
    </div>
  );
}
