'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type SearchFormProps = {
  initialQuery?: string;
};

/**
 * チャンネル検索フォームコンポーネント
 */
export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 空の検索クエリは無視
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    // 検索クエリが100文字を超える場合は制限
    if (trimmedQuery.length > 100) {
      alert('検索キーワードは100文字以内で入力してください');
      return;
    }

    // URLパラメータを更新してページ遷移
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="チャンネル名やキーワードを入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 text-base"
            data-testid="search-input"
            disabled={isPending}
            maxLength={100}
          />
        </div>
        <Button
          type="submit"
          className="h-12 px-6"
          disabled={isPending || !query.trim()}
          data-testid="search-button"
        >
          <Search className="w-5 h-5 mr-2" />
          {isPending ? '検索中...' : '検索'}
        </Button>
      </div>
    </form>
  );
}
