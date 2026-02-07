/**
 * リスト型定義
 */
export interface MyList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * ページネーション付きリスト一覧
 */
export interface PaginatedLists {
  lists: MyList[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
