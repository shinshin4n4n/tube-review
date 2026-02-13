import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function DebugAuthPage() {
  const supabase = await createClient();

  // ユーザー情報を取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // セッション情報を取得
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Cookie情報を取得
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(
    (c) =>
      c.name.includes('supabase') ||
      c.name.includes('auth') ||
      c.name.includes('sb-')
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">認証デバッグ情報</h1>

      {/* ユーザー情報 */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-4">ユーザー情報</h2>
        {userError ? (
          <div className="text-red-600">
            <p>エラー: {userError.message}</p>
          </div>
        ) : user ? (
          <div className="space-y-2">
            <p>
              <strong>ログイン状態:</strong> ✅ ログイン済み
            </p>
            <p>
              <strong>ユーザーID:</strong> {user.id}
            </p>
            <p>
              <strong>メールアドレス:</strong> {user.email}
            </p>
            <p>
              <strong>作成日時:</strong> {user.created_at}
            </p>
          </div>
        ) : (
          <p className="text-gray-600">❌ ログインしていません</p>
        )}
      </div>

      {/* セッション情報 */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-4">セッション情報</h2>
        {sessionError ? (
          <div className="text-red-600">
            <p>エラー: {sessionError.message}</p>
          </div>
        ) : session ? (
          <div className="space-y-2">
            <p>
              <strong>セッション状態:</strong> ✅ 有効
            </p>
            <p>
              <strong>アクセストークン (最初の20文字):</strong>{' '}
              {session.access_token.substring(0, 20)}...
            </p>
            <p>
              <strong>有効期限:</strong>{' '}
              {session.expires_at
                ? new Date(session.expires_at * 1000).toLocaleString('ja-JP')
                : 'なし'}
            </p>
          </div>
        ) : (
          <p className="text-gray-600">❌ セッションなし</p>
        )}
      </div>

      {/* Cookie情報 */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-4">認証関連Cookie</h2>
        {authCookies.length > 0 ? (
          <ul className="space-y-2">
            {authCookies.map((cookie) => (
              <li key={cookie.name} className="border-b pb-2">
                <p>
                  <strong>{cookie.name}</strong>
                </p>
                <p className="text-sm text-gray-600 truncate">
                  値: {cookie.value.substring(0, 50)}
                  {cookie.value.length > 50 ? '...' : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">認証関連のCookieが見つかりません</p>
        )}
      </div>

      {/* 全Cookie情報 */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-4">全Cookie ({allCookies.length}件)</h2>
        <details>
          <summary className="cursor-pointer text-blue-600 hover:underline">
            詳細を表示
          </summary>
          <ul className="mt-4 space-y-2">
            {allCookies.map((cookie) => (
              <li key={cookie.name} className="text-sm border-b pb-2">
                <p>
                  <strong>{cookie.name}</strong>
                </p>
                <p className="text-gray-600 truncate">
                  {cookie.value.substring(0, 100)}
                  {cookie.value.length > 100 ? '...' : ''}
                </p>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
