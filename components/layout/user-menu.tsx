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
 * - Avatar表示（プロフィールで設定した画像を使用）
 * - プロフィール、マイリスト管理、ログアウト
 */
interface UserMenuProps {
  user: User;
  profile?: {
    avatar_url: string | null;
    display_name: string | null;
    username: string;
  } | null;
}

export function UserMenu({ user, profile }: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/');
    router.refresh();
  };

  // プロフィールから表示名とアバターURLを取得
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          aria-label="ユーザーメニュー"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl || undefined} alt="ユーザーアバター" />
            <AvatarFallback className="bg-accent text-white">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/my-channels')} className="cursor-pointer">
          マイチャンネル
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
