'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  createMyListAction,
  updateMyListAction,
} from '@/app/_actions/list';
import type { MyList } from '@/lib/types/list';

interface ListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list?: MyList | null; // 編集時はリストを渡す
}

/**
 * リスト作成・編集ダイアログ
 */
export default function ListFormDialog({
  open,
  onOpenChange,
  list,
}: ListFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const isEditing = !!list;

  // ダイアログが開かれた時にフォームをリセット
  useEffect(() => {
    if (open) {
      if (list) {
        setName(list.name);
        setDescription(list.description || '');
        setIsPublic(list.is_public);
      } else {
        setName('');
        setDescription('');
        setIsPublic(false);
      }
      setErrors({});
    }
  }, [open, list]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (name.trim().length === 0) {
      newErrors.name = 'リスト名を入力してください';
    } else if (name.length > 50) {
      newErrors.name = 'リスト名は50文字以内で入力してください';
    }

    if (description.length > 200) {
      newErrors.description = '説明は200文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;

      if (isEditing && list) {
        // 編集
        result = await updateMyListAction(list.id, {
          name,
          description: description || undefined,
          isPublic,
        });
      } else {
        // 作成
        result = await createMyListAction({
          name,
          description: description || undefined,
          isPublic,
        });
      }

      if (result.success) {
        toast({
          title: isEditing ? 'リストを更新しました' : 'リストを作成しました',
          description: isEditing
            ? 'リストが正常に更新されました'
            : 'リストが正常に作成されました',
        });

        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description:
            result.error ||
            (isEditing
              ? 'リストの更新に失敗しました'
              : 'リストの作成に失敗しました'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('List form error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'リストを編集' : '新しいリストを作成'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'リストの情報を編集できます'
              : 'チャンネルをグループ化するリストを作成します'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* リスト名 */}
          <div>
            <Label htmlFor="name" className="text-base font-semibold">
              リスト名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="例: お気に入りの技術チャンネル"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isSubmitting}
              className="mt-2"
            />
            <p className="text-sm text-content-secondary mt-1">
              {name.length} / 50文字
            </p>
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <Label htmlFor="description" className="text-base font-semibold">
              説明（オプション）
            </Label>
            <Textarea
              id="description"
              placeholder="このリストについて簡単に説明してください..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={200}
              disabled={isSubmitting}
              className="mt-2 resize-none"
            />
            <p className="text-sm text-content-secondary mt-1">
              {description.length} / 200文字
            </p>
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* 公開設定 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4"
            />
            <Label htmlFor="isPublic" className="text-sm cursor-pointer">
              このリストを公開する
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || name.trim().length === 0}
              className="bg-accent hover:bg-accent-hover"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? '更新中...' : '作成中...'}
                </>
              ) : isEditing ? (
                '更新'
              ) : (
                '作成'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
