'use client';

import { useEffect, useState } from 'react';
import { generateErrorId } from '@/lib/logger';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * ルートレイアウトエラーページ
 *
 * app/layout.tsx でエラーが発生した場合に表示
 * htmlとbodyタグを自分で定義する必要がある
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    // エラーIDを生成
    const id = generateErrorId();

    // コンソールにエラーを記録（loggerは使用できない可能性があるため直接console）
    console.error('Global error occurred', {
      errorId: id,
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });

    // setState を非同期で実行
    setTimeout(() => {
      setErrorId(id);
    }, 0);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            padding: '16px',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '48px 32px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* アイコン */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  margin: '0 auto',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(229, 57, 53, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E53935"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            {/* タイトル */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#333333',
                  marginBottom: '16px',
                }}
              >
                重大なエラーが発生しました
              </h1>
              <p
                style={{
                  fontSize: '16px',
                  color: '#6B7280',
                  lineHeight: '1.5',
                }}
              >
                アプリケーションの起動中に問題が発生しました。
                <br />
                ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
              </p>

              {/* エラーID */}
              {errorId && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    エラーID:{' '}
                    <code
                      style={{
                        color: '#E53935',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    >
                      {errorId}
                    </code>
                  </p>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '32px',
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#E53935',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#C62828')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = '#E53935')
                }
              >
                再試行
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#333333',
                  backgroundColor: 'transparent',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s',
                  width: '100%',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f9fafb')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                ホームに戻る
              </button>
            </div>

            {/* 補足情報 */}
            <div
              style={{
                paddingTop: '32px',
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                問題が解決しない場合は、エラーIDを添えて
                <a
                  href="https://github.com/shinshin4n4n/tube-review/issues"
                  style={{
                    color: '#E53935',
                    textDecoration: 'none',
                    margin: '0 4px',
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHubイシュー
                </a>
                からお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
