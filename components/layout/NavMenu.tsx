'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, TrendingUp, Grid, List, Info } from 'lucide-react';

/**
 * ナビゲーションメニューコンポーネント
 * - ヘッダー2行目に配置
 * - 現在のページをハイライト表示
 * - アイコン付きのメニュー項目
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'トップ', href: '/', icon: Home },
  { label: 'ランキング', href: '/ranking', icon: TrendingUp },
  { label: 'カテゴリー', href: '/categories', icon: Grid },
  { label: 'マイチャンネル', href: '/my-channels', icon: List },
  { label: 'ちゅぶれびゅ！とは', href: '/about', icon: Info },
];

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-t border-stroke-light">
      <div className="container mx-auto px-6">
        <ul className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-t-md',
                    isActive
                      ? 'text-primary bg-surface border-b-2 border-primary shadow-sm'
                      : 'text-content-secondary hover:text-content hover:bg-elevated'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
