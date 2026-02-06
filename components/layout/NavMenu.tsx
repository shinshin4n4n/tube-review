'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * ナビゲーションメニューコンポーネント
 * - ヘッダー2行目に配置
 * - 現在のページをハイライト表示
 */

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'トップ', href: '/' },
  { label: 'ランキング', href: '/ranking' },
  { label: 'カテゴリー', href: '/categories' },
  { label: 'マイリスト', href: '/my-list' },
  { label: 'ちゅぶれびゅ！とは', href: '/about' },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-white/10">
      <div className="container mx-auto px-6">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                    isActive
                      ? 'text-white bg-white/20 border-b-2 border-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
