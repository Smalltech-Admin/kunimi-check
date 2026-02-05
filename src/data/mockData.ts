import type { User, Product, Line, Section, CheckRecord } from '@/types';

// Re-export types for convenience
export type { User, Product, Line, Section, CheckRecord };

// Users
export const mockUsers: User[] = [
  {
    id: 'user-uuid-001',
    user_id: 'U001',
    name: '山田 太郎',
    password_hash: '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9', // password
    role: 'manager',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    qr_code: 'QR-U001',
  },
  {
    id: 'user-uuid-002',
    user_id: 'U002',
    name: '佐藤 花子',
    password_hash: '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9',
    role: 'employee',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    qr_code: 'QR-U002',
  },
  {
    id: 'user-uuid-003',
    user_id: 'U003',
    name: '鈴木 一郎',
    password_hash: '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9',
    role: 'employee',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    qr_code: 'QR-U003',
  },
  {
    id: 'user-uuid-004',
    user_id: 'U004',
    name: '田中 美咲',
    password_hash: '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9',
    role: 'employee',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    qr_code: 'QR-U004',
  },
];

// Products
export const mockProducts: Product[] = [
  {
    id: 'prod-uuid-001',
    product_code: 'P001',
    name: '大葉ミンチ',
    icon: '🌿',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'prod-uuid-002',
    product_code: 'P002',
    name: 'しそ巻',
    icon: '🍃',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'prod-uuid-003',
    product_code: 'P003',
    name: '梅しそ',
    icon: '🍑',
    sort_order: 3,
    is_active: true,
  },
];

// Lines
export const mockLines: Line[] = [
  {
    id: 'line-uuid-001',
    line_code: 'L001',
    name: '第1ライン',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'line-uuid-002',
    line_code: 'L002',
    name: '第2ライン',
    sort_order: 2,
    is_active: true,
  },
];

// Sample Template Sections (大葉ミンチ用)
export const mockSections: Section[] = [
  {
    id: 'S1',
    name: '基本情報',
    description: '製造日・担当者・賞味期限を入力',
    items: [
      {
        id: 'S1-1',
        label: '製造日',
        type: 'date',
        required: true,
      },
      {
        id: 'S1-2',
        label: '担当者',
        type: 'user_select',
        required: true,
        allow_self: true,
      },
      {
        id: 'S1-3',
        label: '賞味期限',
        type: 'date',
        required: true,
        hint: '360日後',
        validation: {
          type: 'expiry_date',
          message: '賞味期限が過去の日付です',
        },
      },
    ],
  },
  {
    id: 'S12',
    name: 'フィルター確認【開始前】',
    repeatable: true,
    min_rows: 5,
    max_rows: 5,
    columns_layout: 'horizontal_scroll',
    fixed_labels: ['①水槽（次亜混合）', '②水槽（洗浄）', '③シンク', '④水槽（出口）', '⑤補水'],
    items: [
      {
        id: 'S12-1',
        label: '状態',
        type: 'ok_ng',
        required: true,
        labels: { ok: '良', ng: '不良' },
      },
      {
        id: 'S12-2',
        label: '時間',
        type: 'time',
        required: true,
        allow_now_button: true,
      },
      {
        id: 'S12-3',
        label: '確認者',
        type: 'user_select',
        required: true,
        allow_self: true,
      },
    ],
  },
  {
    id: 'S2',
    name: '配合確認（1-15回目）',
    description: '大葉10kg、製造水10kgの配合を確認',
    repeatable: true,
    min_rows: 1,
    max_rows: 15,
    columns_layout: 'horizontal_scroll',
    items: [
      {
        id: 'S2-1',
        label: '大葉',
        type: 'ok_ng',
        required: true,
        hint: '10kg',
        labels: { ok: '✓', ng: '−' },
      },
      {
        id: 'S2-2',
        label: '製造水',
        type: 'ok_ng',
        required: true,
        hint: '10kg',
        labels: { ok: '✓', ng: '−' },
      },
    ],
  },
  {
    id: 'S9',
    name: 'シール強度確認',
    items: [
      {
        id: 'S9-1',
        label: 'シール強度（前）',
        type: 'number',
        required: true,
        unit: 'kgf',
        validation: {
          type: 'min',
          value: 3.5,
          message: 'シール強度は3.5kgf以上必要です',
        },
      },
      {
        id: 'S9-2',
        label: '確認時刻',
        type: 'time',
        required: true,
        allow_now_button: true,
      },
      {
        id: 'S9-3',
        label: '確認者',
        type: 'user_select',
        required: true,
        allow_self: true,
      },
    ],
  },
  {
    id: 'S20',
    name: 'チラー温度【開始時】',
    items: [
      {
        id: 'S20-1',
        label: '温度',
        type: 'number',
        required: true,
        unit: '℃',
        validation: {
          type: 'max',
          value: 10,
          message: 'チラー温度は10℃以下が必要です',
        },
      },
      {
        id: 'S20-2',
        label: '確認時刻',
        type: 'time',
        required: true,
        allow_now_button: true,
      },
    ],
  },
];

// Sample Records
export const mockRecords: CheckRecord[] = [
  {
    id: 'R20260128-P001-L001-001',
    template_id: 'T001',
    product_id: 'prod-uuid-001',
    line_id: 'line-uuid-001',
    production_date: '2026-01-28',
    batch_number: 1,
    status: 'draft',
    current_editor_id: 'U002',
    created_by: 'U002',
    created_at: '2026-01-28T08:00:00Z',
    submitted_by: null,
    submitted_at: null,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    reject_reason: null,
  },
  {
    id: 'R20260127-P001-L001-001',
    template_id: 'T001',
    product_id: 'prod-uuid-001',
    line_id: 'line-uuid-001',
    production_date: '2026-01-27',
    batch_number: 1,
    status: 'submitted',
    current_editor_id: null,
    created_by: 'U003',
    created_at: '2026-01-27T08:00:00Z',
    submitted_by: 'U003',
    submitted_at: '2026-01-27T16:00:00Z',
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    reject_reason: null,
  },
  {
    id: 'R20260126-P002-L002-001',
    template_id: 'T002',
    product_id: 'prod-uuid-002',
    line_id: 'line-uuid-002',
    production_date: '2026-01-26',
    batch_number: 1,
    status: 'approved',
    current_editor_id: null,
    created_by: 'U004',
    created_at: '2026-01-26T08:00:00Z',
    submitted_by: 'U004',
    submitted_at: '2026-01-26T16:00:00Z',
    approved_by: 'U001',
    approved_at: '2026-01-26T17:00:00Z',
    rejected_by: null,
    rejected_at: null,
    reject_reason: null,
  },
];

// Helper functions
export function getUserById(userId: string): User | undefined {
  return mockUsers.find((u) => u.user_id === userId);
}

export function getUserByQRCode(qrCode: string): User | undefined {
  return mockUsers.find((u) => u.qr_code === qrCode);
}

export function getProductById(productId: string): Product | undefined {
  return mockProducts.find((p) => p.id === productId || p.product_code === productId);
}

export function getLineById(lineId: string): Line | undefined {
  return mockLines.find((l) => l.id === lineId || l.line_code === lineId);
}

export function getActiveUsers(): User[] {
  return mockUsers.filter((u) => u.is_active);
}

export function getActiveProducts(): Product[] {
  return mockProducts.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getActiveLines(): Line[] {
  return mockLines.filter((l) => l.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

export function getRecordsByStatus(status: CheckRecord['status']): CheckRecord[] {
  return mockRecords.filter((r) => r.status === status);
}

export function getDraftRecords(): CheckRecord[] {
  return mockRecords.filter((r) => r.status === 'draft' || r.status === 'rejected');
}

export function getSubmittedRecords(): CheckRecord[] {
  return mockRecords.filter((r) => r.status === 'submitted');
}

export function getRecordById(recordId: string): CheckRecord | undefined {
  return mockRecords.find((r) => r.id === recordId);
}

// デモ用：レコードのステータスを更新
export function updateRecordStatus(
  recordId: string,
  status: CheckRecord['status'],
  userId: string,
  rejectReason?: string
): CheckRecord | undefined {
  const record = mockRecords.find((r) => r.id === recordId);
  if (!record) return undefined;

  record.status = status;
  const now = new Date().toISOString();

  if (status === 'approved') {
    record.approved_by = userId;
    record.approved_at = now;
  } else if (status === 'rejected') {
    record.rejected_by = userId;
    record.rejected_at = now;
    record.reject_reason = rejectReason || null;
  }

  return record;
}

// 履歴用：承認済み・差戻しレコードを取得
export function getHistoryRecords(): CheckRecord[] {
  return mockRecords
    .filter((r) => r.status === 'approved' || r.status === 'rejected')
    .sort((a, b) => {
      // 最新順にソート
      const dateA = a.approved_at || a.rejected_at || a.created_at;
      const dateB = b.approved_at || b.rejected_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
}

// フィルター付き履歴取得
export interface HistoryFilter {
  productId?: string;
  status?: 'approved' | 'rejected' | 'all';
  startDate?: string;
  endDate?: string;
}

export function getFilteredHistoryRecords(filter: HistoryFilter): CheckRecord[] {
  let records = getHistoryRecords();

  // 製品フィルター
  if (filter.productId && filter.productId !== 'all') {
    records = records.filter((r) => r.product_id === filter.productId);
  }

  // ステータスフィルター
  if (filter.status && filter.status !== 'all') {
    records = records.filter((r) => r.status === filter.status);
  }

  // 期間フィルター（開始日）
  if (filter.startDate) {
    records = records.filter((r) => r.production_date >= filter.startDate!);
  }

  // 期間フィルター（終了日）
  if (filter.endDate) {
    records = records.filter((r) => r.production_date <= filter.endDate!);
  }

  return records;
}
