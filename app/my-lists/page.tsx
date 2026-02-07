import { redirect } from 'next/navigation';

/**
 * マイリスト管理ページ（旧）
 * /my-channels?tab=lists にリダイレクト
 */
export default function MyListsPage() {
  redirect('/my-channels?tab=lists');
}
