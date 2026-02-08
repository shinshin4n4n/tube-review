'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ListFormDialog from '@/app/_components/list-form-dialog';
import DeleteReviewDialog from '@/app/_components/delete-review-dialog';
import { deleteMyListAction, getMyListsAction } from '@/app/_actions/list';
import type { MyList } from '@/lib/types/list';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * カスタムリストコンポーネント
 */
export default function CustomLists() {
  const { toast } = useToast();
  const [lists, setLists] = useState<MyList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingList, setEditingList] = useState<MyList | null>(null);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getMyListsAction();

      if (result.success) {
        setLists(result.data.lists);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

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
        setLists((prev) => prev.filter((list) => list.id !== deletingListId));
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

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowCreateDialog(false);
      setEditingList(null);
      // リストを再取得
      fetchLists();
    }
  };

  const fetchLists = async () => {
    const result = await getMyListsAction();
    if (result.success) {
      setLists(result.data.lists);
    }
  };

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (lists.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">まだリストがありません</p>
          <p className="text-sm text-gray-400 mb-6">
            カスタムリストを作成して、お気に入りのチャンネルをテーマ別にグループ化できます
          </p>
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
          onOpenChange={handleDialogClose}
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-content-secondary">{lists.length} 件のリスト</p>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-accent hover:bg-accent-hover"
        >
          <Plus className="mr-2 h-4 w-4" />
          新しいリストを作成
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lists.map((list) => (
          <Card key={list.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <a
                    href={`/my-channels/lists/${list.id}`}
                    className="font-semibold text-lg truncate hover:text-accent transition-colors block"
                  >
                    {list.title}
                  </a>
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
                  {isClient
                    ? formatDistanceToNow(new Date(list.created_at), {
                        addSuffix: true,
                        locale: ja,
                      })
                    : new Date(list.created_at).toLocaleDateString('ja-JP')}
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
        onOpenChange={handleDialogClose}
      />

      {/* 編集ダイアログ */}
      {editingList && (
        <ListFormDialog
          open={!!editingList}
          onOpenChange={(open) => handleDialogClose(open)}
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
