'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  onUploadComplete?: (url: string) => void;
  disabled?: boolean;
}

/**
 * アバター画像アップロードコンポーネント
 */
export function AvatarUploader({
  currentAvatarUrl,
  onUploadComplete,
  disabled,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // TODO: Supabase Storageへのアップロード実装
    // 現在はプレビューのみ対応
    setIsUploading(true);
    try {
      // Supabase Storageへのアップロード処理をここに実装
      // const url = await uploadToSupabaseStorage(file);
      // onUploadComplete?.(url);

      // 暫定実装: プレビューURLのみ設定
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      alert('アップロードに失敗しました');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Label className="text-base font-semibold mb-2 block">
        プロフィール画像
      </Label>
      <div className="flex items-center gap-4">
        {/* アバタープレビュー */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Upload size={32} />
            </div>
          )}
        </div>

        {/* アップロードボタン */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                画像を選択
              </>
            )}
          </Button>
          <p className="text-sm text-content-secondary mt-1">
            推奨: 正方形、5MB以下
          </p>
        </div>
      </div>
    </div>
  );
}
