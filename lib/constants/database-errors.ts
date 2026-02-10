/**
 * PostgreSQL エラーコード定数
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

/**
 * Class 23 — Integrity Constraint Violation
 */
export const DB_ERROR_CODES = {
  /** 一意性制約違反 (Unique Violation) */
  UNIQUE_VIOLATION: '23505',

  /** 外部キー制約違反 (Foreign Key Violation) */
  FOREIGN_KEY_VIOLATION: '23503',

  /** NOT NULL制約違反 (Not Null Violation) */
  NOT_NULL_VIOLATION: '23502',

  /** CHECK制約違反 (Check Violation) */
  CHECK_VIOLATION: '23514',
} as const;

/**
 * エラーコードの型
 */
export type DbErrorCode = typeof DB_ERROR_CODES[keyof typeof DB_ERROR_CODES];

/**
 * PostgreSQLエラーかどうかを判定
 */
export function isPostgresError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}
