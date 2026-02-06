'use client';

import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 検索バーコンポーネント
 * - ヘッダー1行目に配置
 * - レスポンシブ対応（モバイル時は展開式）
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsMobileSearchOpen(false);
        setQuery('');
      }
    },
    [query, router]
  );

  return (
    <>
      {/* デスクトップ検索バー */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center flex-1 max-w-2xl mx-8"
      >
        <div className="relative w-full">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="チャンネルを検索..."
            className="w-full h-11 pl-11 pr-4 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>

      {/* モバイル検索アイコン */}
      <button
        type="button"
        onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
        className="md:hidden p-2 rounded-md hover:bg-white/15 transition-colors"
        aria-label="検索"
      >
        {isMobileSearchOpen ? (
          <X size={24} />
        ) : (
          <Search size={24} />
        )}
      </button>

      {/* モバイル検索オーバーレイ */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] bg-primary/95 backdrop-blur-sm z-40 p-4 shadow-lg">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="チャンネルを検索..."
                className="w-full h-11 pl-11 pr-4 rounded-lg border border-stroke bg-surface text-content placeholder:text-content-disabled focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
