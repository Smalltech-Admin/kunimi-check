/**
 * 操作ログ記録ユーティリティ
 * IP/User-Agentをサーバーサイドで取得するためAPI経由で記録
 */

export interface OperationLogParams {
  user_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * 操作ログを記録
 * FSSC22000対応: IP/User-Agentをサーバーサイドで自動取得
 */
export async function logOperation(params: OperationLogParams): Promise<void> {
  try {
    const response = await fetch('/api/operation-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OperationLog] Failed to log operation:', errorData);
    }
  } catch (err) {
    // ログ記録の失敗は業務処理を止めない（ベストエフォート）
    console.error('[OperationLog] Network error:', err);
  }
}
