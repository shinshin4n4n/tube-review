/**
 * ロガーユーティリティ
 *
 * アプリケーション全体で使用するログ機能を提供
 * 本番環境ではVercel Analyticsと連携
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * 環境に応じたログ出力
 */
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = process.env.LOG_LEVEL || 'info';
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(currentLevel as LogLevel);
};

/**
 * ログエントリを作成
 */
const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  context: sanitizeContext(context),
  error,
});

/**
 * 個人情報やセンシティブ情報を除外
 */
const sanitizeContext = (
  context?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!context) return undefined;

  const sanitized = { ...context };
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
  ];

  Object.keys(sanitized).forEach((key) => {
    if (
      sensitiveKeys.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase())
      )
    ) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * コンソールにログ出力
 */
const logToConsole = (entry: LogEntry): void => {
  const { level, message, timestamp, context, error } = entry;

  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
    case 'debug':
      console.debug(logMessage, context);
      break;
    case 'info':
      console.info(logMessage, context);
      break;
    case 'warn':
      console.warn(logMessage, context);
      break;
    case 'error':
      console.error(logMessage, context, error);
      break;
  }
};

/**
 * Vercel Analyticsにエラーを送信（本番環境のみ）
 */
const sendToAnalytics = async (entry: LogEntry): Promise<void> => {
  // 本番環境かつエラーレベルのみ
  if (process.env.NODE_ENV !== 'production' || entry.level !== 'error') {
    return;
  }

  try {
    // Vercel Analytics Web Vitals APIを使用
    if (typeof window !== 'undefined' && 'sendBeacon' in navigator) {
      const payload = JSON.stringify({
        name: 'error',
        value: entry.message,
        timestamp: entry.timestamp,
        context: entry.context,
      });

      navigator.sendBeacon('/api/analytics/error', payload);
    }
  } catch (error) {
    // Analytics送信エラーは無視（ログ送信の失敗でアプリを止めない）
    console.warn('Failed to send error to analytics:', error);
  }
};

/**
 * ロガーインスタンス
 */
export const logger = {
  /**
   * デバッグログ
   */
  debug: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('debug')) return;

    const entry = createLogEntry('debug', message, context);
    logToConsole(entry);
  },

  /**
   * 情報ログ
   */
  info: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('info')) return;

    const entry = createLogEntry('info', message, context);
    logToConsole(entry);
  },

  /**
   * 警告ログ
   */
  warn: (message: string, context?: Record<string, unknown>) => {
    if (!shouldLog('warn')) return;

    const entry = createLogEntry('warn', message, context);
    logToConsole(entry);
  },

  /**
   * エラーログ
   */
  error: (
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ) => {
    if (!shouldLog('error')) return;

    const entry = createLogEntry('error', message, context, error);
    logToConsole(entry);
    sendToAnalytics(entry);
  },
};

/**
 * エラーIDを生成（サポート問い合わせ用）
 */
export const generateErrorId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
};
