import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { UserMenu } from './user-menu';
import { MobileMenu } from './mobile-menu';

/**
 * ヘッダーナビゲーションコンポーネント
 * - Primary色(#6D4C41)の背景
 * - ロゴ「ちゅぶれびゅ！」
 * - メインナビゲーション
 * - ユーザーメニュー（認証済み時）
 * - モバイルメニュー（768px未満）
 */
export async function Header() {
  const user = await getUser();

  return (
    <header className="bg-primary text-white shadow-base">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="text-xl font-bold hover:opacity-90 transition-opacity">
            ちゅぶれびゅ！
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              トップ
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              検索
            </Link>
            <Link
              href="/my-list"
              className="px-4 py-2 rounded-md hover:bg-white/15 transition-colors duration-200"
            >
              マイリスト
            </Link>
          </nav>

          {/* デスクトップユーザーメニュー */}
          <div className="hidden md:block">
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
          <div className="md:hidden">
            <MobileMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
