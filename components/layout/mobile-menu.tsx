'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { signOutAction } from '@/app/_actions/auth';
import type { User } from '@supabase/supabase-js';

/**
 * モバイルメニューコンポーネント
 * - Sheetを使用したスライドメニュー
 * - ハンバーガーアイコン
 * - ナビゲーションリスト
 * - 認証状態に応じた表示切り替え
 */
export function MobileMenu({ user }: { user: User | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutAction();
    setOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleNavigation = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const initials = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 rounded-md hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          aria-label="メニュー"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>メニュー</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* ユーザー情報（認証済みの場合） */}
          {user && (
            <div className="flex items-center gap-3 pb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.user_metadata?.avatar_url} alt="ユーザーアバター" />
                <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            </div>
          )}

          {/* ナビゲーションリンク */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => handleNavigation('/')}
              className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
            >
              トップ
            </button>
            <button
              onClick={() => handleNavigation('/categories')}
              className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
            >
              カテゴリー
            </button>
            <button
              onClick={() => handleNavigation('/search')}
              className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
            >
              検索
            </button>
            <button
              onClick={() => handleNavigation('/my-list')}
              className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
            >
              マイリスト
            </button>
          </nav>

          {/* 認証状態別メニュー */}
          {user ? (
            <>
              <Separator />
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => handleNavigation('/profile')}
                  className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
                >
                  プロフィール
                </button>
                <button
                  onClick={() => handleNavigation('/my-lists')}
                  className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors"
                >
                  マイリスト管理
                </button>
              </nav>
              <Separator />
              <button
                onClick={handleSignOut}
                className="text-left px-4 py-3 rounded-md hover:bg-base transition-colors text-red-600"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Separator />
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="px-4 py-3 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors text-center"
              >
                ログイン
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
