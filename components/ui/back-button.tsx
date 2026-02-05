'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 戻るボタンコンポーネント
 *
 * ブラウザの履歴を使用して前のページに戻るボタンを表示します。
 * Client Componentとして実装されており、useRouter().back()を使用します。
 */
export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.back()}
      className="mb-4 text-content-secondary hover:text-primary"
      aria-label="前のページに戻る"
      data-testid="back-button"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      戻る
    </Button>
  );
}
