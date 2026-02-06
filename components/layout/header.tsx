import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { UserMenu } from './user-menu';
import { MobileMenu } from './mobile-menu';
import { SearchBar } from './SearchBar';
import { NavMenu } from './NavMenu';

/**
 * ヘッダーナビゲーションコンポーネント（2段構成）
 *
 * 1行目:
 * - ロゴ「ちゅぶれびゅ！」（左）
 * - 検索バー（中央〜左寄り）
 * - ユーザーメニュー/ログインボタン（右）
 *
 * 2行目:
 * - ナビゲーションメニュー（トップ、ランキング、カテゴリー、マイリスト、ちゅぶれびゅ！とは）
 * - アクティブページのハイライト表示
 *
 * レスポンシブ対応:
 * - モバイル時: 検索窓はアイコン化、ナビメニューはハンバーガーメニュー内
 */
export async function Header() {
  const user = await getUser();

  return (
    <header className="bg-primary text-white shadow-base sticky top-0 z-50">
      {/* 1行目: ロゴ + 検索バー + ユーザーメニュー */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* ロゴ */}
            <Link
              href="/"
              className="text-xl font-bold hover:opacity-90 transition-opacity shrink-0"
            >
              ちゅぶれびゅ！
            </Link>

            {/* 検索バー */}
            <SearchBar />

            {/* デスクトップユーザーメニュー */}
            <div className="hidden md:flex items-center shrink-0">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <Link
                  href="/login"
                  className="inline-block px-4 py-2 bg-accent rounded-md hover:bg-accent-hover transition-colors duration-200"
                >
                  ログイン
                </Link>
              )}
            </div>

            {/* モバイルメニュー */}
            <div className="md:hidden shrink-0">
              <MobileMenu user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* 2行目: ナビゲーションメニュー（デスクトップのみ表示） */}
      <div className="hidden md:block">
        <NavMenu />
      </div>
    </header>
  );
}
