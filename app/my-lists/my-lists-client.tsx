'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ListFormDialog from '@/app/_components/list-form-dialog';
import DeleteReviewDialog from '@/app/_components/delete-review-dialog';
import { deleteMyListAction } from '@/app/_actions/list';
import type { PaginatedLists, MyList } from '@/lib/types/list';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MyListsClientProps {
  initialData: PaginatedLists;
  userId: string;
}

/**
 * マイリスト管理クライアントコンポーネント
 */
export default function MyListsClient({
  initialData,
}: MyListsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingList, setEditingList] = useState<MyList | null>(null);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (list: MyList) => {
    setEditingList(list);
  };

  const handleDelete = (listId: string) => {
    setDeletingListId(listId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingListId) return;

    setIsDeleting(true);

    try {
      const result = await deleteMyListAction(deletingListId);

      if (result.success) {
        toast({
          title: 'リストを削除しました',
          description: 'リストが正常に削除されました',
        });

        setDeletingListId(null);
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'リストの削除に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('List delete error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialData.lists.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">まだリストがありません</p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-accent hover:bg-accent-hover"
          >
            <Plus className="mr-2 h-4 w-4" />
            最初のリストを作成
          </Button>
        </div>

        <ListFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-content-secondary">
          {initialData.pagination.total} 件のリスト
        </p>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-accent hover:bg-accent-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          新しいリストを作成
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialData.lists.map((list) => (
          <Card key={list.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {list.name}
                  </h3>
                  {list.is_public && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      公開
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {list.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {list.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(list.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(list)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(list.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 作成ダイアログ */}
      <ListFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* 編集ダイアログ */}
      {editingList && (
        <ListFormDialog
          open={!!editingList}
          onOpenChange={(open) => !open && setEditingList(null)}
          list={editingList}
        />
      )}

      {/* 削除確認ダイアログ */}
      <DeleteReviewDialog
        open={!!deletingListId}
        onOpenChange={(open) => !open && setDeletingListId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
