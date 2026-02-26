/**
 * UUID v4 形式の正規表現
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 文字列がUUID形式かどうかを判定する
 * @param value 判定対象の文字列
 * @returns UUID形式の場合 true
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}
