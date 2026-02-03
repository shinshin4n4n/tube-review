import Link from 'next/link';

/**
 * ヘッダーナビゲーションコンポーネント
 * - Primary色(#6D4C41)の背景
 * - ロゴ「ちゅぶれびゅ！」
 * - メインナビゲーション
 */
export function Header() {
  return (
    <header className="bg-primary text-white shadow-base">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-xl font-bold hover:opacity-90 transition-opacity">
            ちゅぶれびゅ！
          </Link>

          {/* ナビゲーション */}
          <nav className="flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              トップ
            </Link>
            <Link
              href="/ranking"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              ランキング
            </Link>
            <Link
              href="/new"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              新着
            </Link>
            <Link
              href="/my-list"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              マイリスト
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
