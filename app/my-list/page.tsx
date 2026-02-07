import { redirect } from 'next/navigation';

/**
 * マイリストページ（旧）
 * /my-channels にリダイレクト
 */
export default function MyListPage() {
  redirect('/my-channels');
}
