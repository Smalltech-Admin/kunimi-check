import type { User, CheckRecord, Role } from '@/types';

/**
 * 承認権限チェック
 */
export function canApprove(user: User): boolean {
  return user.role === 'manager';
}

/**
 * 差戻し権限チェック
 */
export function canReject(user: User): boolean {
  return user.role === 'manager';
}

/**
 * 編集権限チェック
 */
export function canEdit(user: User, record: CheckRecord): boolean {
  // 下書きまたは差戻しのみ編集可能
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  // 作成者または現在の編集者のみ（UUIDで比較）
  return (
    record.created_by === user.id ||
    record.current_editor_id === user.id
  );
}

/**
 * 削除権限チェック
 */
export function canDelete(user: User, record: CheckRecord): boolean {
  // 下書きまたは差戻しのみ削除可能
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  // 作成者、現在の編集者、または管理者（UUIDで比較）
  return (
    record.created_by === user.id ||
    record.current_editor_id === user.id ||
    user.role === 'manager'
  );
}

/**
 * 引き継ぎ権限チェック
 */
export function canTakeOver(user: User, record: CheckRecord): boolean {
  // 下書きまたは差戻しで、自分が編集者でない場合
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  return record.current_editor_id !== user.id;
}

/**
 * ロール表示名
 */
export function getRoleDisplayName(role: Role): string {
  return role === 'manager' ? '管理者' : '作業者';
}

/**
 * SHA-256ハッシュ生成（Web Crypto API）
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * パスワード検証
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
