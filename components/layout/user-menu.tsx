'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/app/_actions/auth';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

/**
 * ユーザーメニューコンポーネント
 * - DropdownMenuを使用したユーザーメニュー
 * - Avatar表示
 * - プロフィール、マイリスト管理、ログアウト
 */
export function UserMenu({ user }: { user: User }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/');
    router.refresh();
  };

  const initials = user.email?.[0]?.toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          aria-label="ユーザーメニュー"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="ユーザーアバター" />
            <AvatarFallback className="bg-accent text-white">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-lists')} className="cursor-pointer">
          マイリスト管理
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
