import { createClient } from '@/lib/supabase/server';
import {
  YouTubeOperation,
  YouTubeApiError,
  YouTubeErrorCode,
  DAILY_QUOTA_LIMIT,
  OPERATION_COSTS,
  OPERATION_LIMITS,
  QuotaUsage,
} from './types';

/**
 * YouTube API レート制限管理クラス
 * Token Bucket アルゴリズムを使用してクォータを管理
 */
export class YouTubeRateLimiter {
  /**
   * クォータチェックと消費を実行
   * @param operation 実行する操作タイプ
   * @throws {YouTubeApiError} クォータ超過時
   */
  async checkQuota(operation: YouTubeOperation): Promise<void> {
    try {
      const supabase = await createClient();
      const today = this.getCurrentDate();

      // 現在のクォータ使用量を取得
      const { data: quotaData, error: fetchError } = await supabase
        .from('quota_usage')
        .select('*')
        .eq('date', today)
        .single();

      // データが存在しない、または日付が異なる場合は新規作成
      if (
        fetchError?.code === 'PGRST116' ||
        !quotaData ||
        quotaData.date !== today
      ) {
        await this.createQuotaEntry(operation, today);
        return;
      }

      // 他のエラーの場合はスロー
      if (fetchError) {
        throw new Error(`Supabase error: ${fetchError.message}`);
      }

      const quota = quotaData as QuotaUsage;

      // 日次クォータチェック
      const cost = OPERATION_COSTS[operation];
      if (quota.used + cost > DAILY_QUOTA_LIMIT) {
        throw new YouTubeApiError(
          YouTubeErrorCode.QUOTA_EXCEEDED,
          `Daily YouTube API quota exceeded (${quota.used}/${DAILY_QUOTA_LIMIT} units used)`
        );
      }

      // 操作別上限チェック
      const operationCount = quota.operations[operation] || 0;
      if (operationCount >= OPERATION_LIMITS[operation]) {
        throw new YouTubeApiError(
          YouTubeErrorCode.QUOTA_EXCEEDED,
          `YouTube API ${operation} operation limit exceeded (${operationCount}/${OPERATION_LIMITS[operation]} operations)`
        );
      }

      // クォータを消費
      await this.consumeQuota(operation, quota, today);
    } catch (error) {
      if (error instanceof YouTubeApiError) {
        throw error;
      }

      console.error('Rate limiter error:', error);
      throw new YouTubeApiError(
        YouTubeErrorCode.UNKNOWN_ERROR,
        'Failed to check quota',
        error
      );
    }
  }

  /**
   * 新しいクォータエントリを作成
   */
  private async createQuotaEntry(
    operation: YouTubeOperation,
    date: string
  ): Promise<void> {
    const supabase = await createClient();
    const cost = OPERATION_COSTS[operation];

    const { error } = await supabase
      .from('quota_usage')
      .insert({
        date,
        used: cost,
        operations: {
          search: operation === 'search' ? 1 : 0,
          details: operation === 'details' ? 1 : 0,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create quota entry: ${error.message}`);
    }
  }

  /**
   * クォータを消費（更新）
   */
  private async consumeQuota(
    operation: YouTubeOperation,
    currentQuota: QuotaUsage,
    date: string
  ): Promise<void> {
    const supabase = await createClient();
    const cost = OPERATION_COSTS[operation];

    const newUsed = currentQuota.used + cost;
    const newOperations: { search: number; details: number } = {
      ...currentQuota.operations,
      [operation]: (currentQuota.operations[operation] || 0) + 1,
    };

    const { error } = await supabase
      .from('quota_usage')
      .update({
        used: newUsed,
        operations: newOperations,
      })
      .eq('date', date)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update quota: ${error.message}`);
    }
  }

  /**
   * 現在の日付を YYYY-MM-DD 形式で取得（UTC）
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]!;
  }
}

// シングルトンインスタンスをエクスポート
export const youtubeRateLimiter = new YouTubeRateLimiter();
