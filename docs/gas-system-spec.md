# 製造工程チェックシステム Next.js + Supabase 移行仕様書

## 概要

食品製造工場向けの製造工程チェック表デジタル化システム。
タブレットでの入力、承認ワークフロー、履歴検索を実現。

---

## 1. データ構造

### 1.1 users（ユーザーマスタ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| user_id | VARCHAR(10) | PK | ユーザーID（例: U001） |
| name | VARCHAR(50) | NOT NULL | 表示名 |
| password_hash | VARCHAR(64) | NOT NULL | SHA-256ハッシュ |
| role | VARCHAR(20) | NOT NULL | 権限: 'employee' / 'manager' |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |
| created_at | TIMESTAMP | DEFAULT now() | 作成日時 |

```sql
-- Supabase DDL
CREATE TABLE users (
  user_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  password_hash VARCHAR(64) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 products（製品マスタ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| product_id | VARCHAR(10) | PK | 製品ID（例: P001） |
| name | VARCHAR(100) | NOT NULL | 製品名 |
| icon | VARCHAR(50) | | Bootstrap Iconクラス |
| sort_order | INTEGER | DEFAULT 0 | 表示順 |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |

```sql
CREATE TABLE products (
  product_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

### 1.3 lines（製造ラインマスタ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| line_id | VARCHAR(10) | PK | ラインID（例: L001） |
| name | VARCHAR(100) | NOT NULL | ライン名 |
| sort_order | INTEGER | DEFAULT 0 | 表示順 |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |

```sql
CREATE TABLE lines (
  line_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

### 1.4 templates（チェック表テンプレート）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| template_id | VARCHAR(10) | PK | テンプレートID（例: T001） |
| product_id | VARCHAR(10) | FK → products | 製品ID |
| version | INTEGER | NOT NULL | バージョン番号 |
| sections_json | JSONB | NOT NULL | セクション定義JSON |
| created_at | TIMESTAMP | DEFAULT now() | 作成日時 |
| is_active | BOOLEAN | DEFAULT true | 有効フラグ |

```sql
CREATE TABLE templates (
  template_id VARCHAR(10) PRIMARY KEY,
  product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
  version INTEGER NOT NULL,
  sections_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_templates_product ON templates(product_id, is_active, version DESC);
```

### 1.5 records（チェック表データ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| record_id | VARCHAR(50) | PK | レコードID（例: R20251228-P001-L001-001） |
| template_id | VARCHAR(10) | FK → templates | テンプレートID |
| product_id | VARCHAR(10) | FK → products | 製品ID |
| line_id | VARCHAR(10) | FK → lines | ラインID |
| production_date | DATE | NOT NULL | 製造日 |
| batch_number | INTEGER | NOT NULL | バッチ番号 |
| status | VARCHAR(20) | NOT NULL | ステータス |
| current_editor_id | VARCHAR(10) | FK → users | 現在の編集者 |
| created_by | VARCHAR(10) | FK → users | 作成者 |
| created_at | TIMESTAMP | DEFAULT now() | 作成日時 |
| submitted_by | VARCHAR(10) | FK → users | 提出者 |
| submitted_at | TIMESTAMP | | 提出日時 |
| approved_by | VARCHAR(10) | FK → users | 承認者 |
| approved_at | TIMESTAMP | | 承認日時 |
| rejected_by | VARCHAR(10) | FK → users | 差戻し者 |
| rejected_at | TIMESTAMP | | 差戻し日時 |
| reject_reason | TEXT | | 差戻し理由 |

**ステータス値:**
- `draft`: 入力中
- `submitted`: 承認待ち
- `approved`: 承認済
- `rejected`: 差戻し

```sql
CREATE TABLE records (
  record_id VARCHAR(50) PRIMARY KEY,
  template_id VARCHAR(10) NOT NULL REFERENCES templates(template_id),
  product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
  line_id VARCHAR(10) NOT NULL REFERENCES lines(line_id),
  production_date DATE NOT NULL,
  batch_number INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  current_editor_id VARCHAR(10) REFERENCES users(user_id),
  created_by VARCHAR(10) NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_by VARCHAR(10) REFERENCES users(user_id),
  submitted_at TIMESTAMPTZ,
  approved_by VARCHAR(10) REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  rejected_by VARCHAR(10) REFERENCES users(user_id),
  rejected_at TIMESTAMPTZ,
  reject_reason TEXT,

  UNIQUE(product_id, line_id, production_date, batch_number)
);

CREATE INDEX idx_records_status ON records(status);
CREATE INDEX idx_records_production_date ON records(production_date);
CREATE INDEX idx_records_editor ON records(current_editor_id, status);
```

### 1.6 record_items（入力値データ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| id | UUID | PK | 主キー |
| record_id | VARCHAR(50) | FK → records | レコードID |
| item_id | VARCHAR(20) | NOT NULL | 項目ID |
| row_index | INTEGER | DEFAULT 0 | 行インデックス（繰り返しセクション用） |
| value | TEXT | | 入力値 |
| is_valid | BOOLEAN | DEFAULT true | バリデーション結果 |
| input_by | VARCHAR(10) | FK → users | 入力者 |
| input_at | TIMESTAMP | DEFAULT now() | 入力日時 |

```sql
CREATE TABLE record_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id VARCHAR(50) NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  item_id VARCHAR(20) NOT NULL,
  row_index INTEGER DEFAULT 0,
  value TEXT,
  is_valid BOOLEAN DEFAULT true,
  input_by VARCHAR(10) REFERENCES users(user_id),
  input_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_record_items_record ON record_items(record_id);
CREATE INDEX idx_record_items_lookup ON record_items(record_id, item_id, row_index);
```

### 1.7 operation_logs（操作ログ）

| カラム名 | データ型 | 制約 | 説明 |
|----------|----------|------|------|
| log_id | UUID | PK | ログID |
| user_id | VARCHAR(10) | FK → users | 操作者 |
| action | VARCHAR(50) | NOT NULL | アクション種別 |
| target_id | VARCHAR(50) | | 対象ID |
| details | JSONB | | 詳細情報 |
| timestamp | TIMESTAMP | DEFAULT now() | 日時 |

**アクション種別:**
- `login` / `logout`
- `create` / `update` / `delete_record`
- `submit` / `approve` / `reject`
- `take_over`

```sql
CREATE TABLE operation_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(10) REFERENCES users(user_id),
  action VARCHAR(50) NOT NULL,
  target_id VARCHAR(50),
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_operation_logs_user ON operation_logs(user_id, timestamp DESC);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_id, timestamp DESC);
```

---

## 2. チェック項目テンプレート

### 2.1 セクション構成

テンプレートは複数のセクションで構成される。各セクションには項目（items）が含まれる。

#### セクション定義

```typescript
interface Section {
  section_id: string;           // セクションID（例: "S1", "S2"）
  name: string;                 // セクション名
  description?: string;         // 説明文

  // 繰り返しセクション設定
  repeatable?: boolean;         // 繰り返し可能か
  min_rows?: number;            // 最小行数
  max_rows?: number;            // 最大行数
  columns_layout?: 'horizontal_scroll'; // 横スクロール表形式
  fixed_labels?: string[];      // 固定ラベル（行ごとのラベル）

  items?: Item[];               // 項目配列
}
```

### 2.2 項目定義

```typescript
interface Item {
  item_id: string;              // 項目ID（例: "S1-1"）
  label: string;                // 表示ラベル
  type: ItemType;               // 入力タイプ
  required?: boolean;           // 必須フラグ
  unit?: string;                // 単位（例: "kg", "℃"）
  hint?: string;                // ヒント文（例: "目安: 10kg"）

  // OK/NG選択用
  labels?: {
    ok: string;                 // OKのラベル（例: "良", "無"）
    ng: string;                 // NGのラベル（例: "不良", "有"）
  };

  // 選択肢（select型用）
  options?: string[];           // 選択肢配列

  // ユーザー選択用
  allow_self?: boolean;         // 「自分」ボタン表示

  // 時刻入力用
  allow_now_button?: boolean;   // 「現在時刻」ボタン表示

  // バリデーション
  validation?: ValidationRule;
}

type ItemType =
  | 'text'        // テキスト入力
  | 'number'      // 数値入力
  | 'date'        // 日付選択
  | 'time'        // 時刻入力
  | 'ok_ng'       // OK/NG選択
  | 'select'      // ドロップダウン選択
  | 'user_select' // ユーザー選択
```

### 2.3 テンプレートJSON例（大葉ミンチ）

```json
[
  {
    "section_id": "S1",
    "name": "基本情報",
    "description": "製造日・担当者・賞味期限を入力",
    "items": [
      {
        "item_id": "S1-1",
        "label": "製造日",
        "type": "date",
        "required": true
      },
      {
        "item_id": "S1-2",
        "label": "担当者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "item_id": "S1-3",
        "label": "賞味期限",
        "type": "date",
        "required": true,
        "hint": "360日後",
        "validation": {
          "type": "expiry_date",
          "message": "賞味期限が過去の日付です"
        }
      }
    ]
  },
  {
    "section_id": "S12",
    "name": "フィルター確認【開始前】",
    "repeatable": true,
    "min_rows": 5,
    "max_rows": 5,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": ["①水槽（次亜混合）", "②水槽（洗浄）", "③シンク", "④水槽（出口）", "⑤補水"],
    "items": [
      {
        "item_id": "S12-1",
        "label": "状態",
        "type": "ok_ng",
        "required": true,
        "labels": { "ok": "良", "ng": "不良" }
      },
      {
        "item_id": "S12-2",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "item_id": "S12-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "section_id": "S2",
    "name": "配合確認（1-15回目）",
    "description": "大葉10kg、製造水10kgの配合を確認",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 15,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "item_id": "S2-1",
        "label": "大葉",
        "type": "ok_ng",
        "required": true,
        "hint": "10kg",
        "labels": { "ok": "✓", "ng": "−" }
      },
      {
        "item_id": "S2-2",
        "label": "製造水",
        "type": "ok_ng",
        "required": true,
        "hint": "10kg",
        "labels": { "ok": "✓", "ng": "−" }
      }
    ]
  }
]
```

### 2.4 セクション分類

#### 製造開始前チェック
- S1: 基本情報
- S12: フィルター確認【開始前】
- S15: 使用備品点検【開始前】
- S13: 使用設備点検＜コミットロール＞
- S14-B: カッティングヘッド・インペラー【開始前】
- S11-B: 虫取りマグネット【開始前】
- S16: クロール試験紙使用期限
- S9/S9-start: シール強度確認
- S10: シール機設定詳細
- S22: 計測器確認
- S23: 風袋重量確認
- S20-B: チラー温度【開始時】

#### 製造中チェック
- S2: 配合確認（1-15回目）
- S2-confirm: 配合確認者（1-15回目）
- S7: 配合確認（16-30回目）
- S7-confirm: 配合確認者（16-30回目）
- S3/S3-time/S3-ppm: 次亜塩素酸殺菌確認（1-15回目）
- S8/S8-time/S8-ppm: 次亜塩素酸殺菌確認（16-30回目）
- S14-M: カッティングヘッド・インペラー【中間時】

#### ボイル工程
- S17: ボイルチェック表基本情報
- S18: ボイル時間/製品温度確認
- S19: 冷却確認
- S21/S21-cart/S21-fraction: 台車別管理

#### 製造終了時チェック
- S12-end: フィルター確認【終了時】
- S15-end: 使用備品点検【終了時】
- S14-E: カッティングヘッド・インペラー【終了時】
- S11-E: 虫取りマグネット【終了時】
- S9-end: シール強度確認【終了時】
- S20-E: チラー温度【終了時】

#### 集計
- S4: 大葉原料処理量
- S5: 使用資材
- S6: 製品出来高

---

## 3. バリデーションルール

### 3.1 バリデーション型定義

```typescript
interface ValidationRule {
  type: 'min' | 'max' | 'range' | 'expiry_date' | 'equals' | 'pattern';
  value?: number;         // min, max, equals用
  min?: number;           // range用
  max?: number;           // range用
  regex?: string;         // pattern用
  message: string;        // エラーメッセージ
}
```

### 3.2 バリデーション種別

| type | 説明 | パラメータ | 例 |
|------|------|-----------|-----|
| min | 最小値チェック | value | シール強度3.5以上 |
| max | 最大値チェック | value | 温度10℃以下、水分値1.5%以下 |
| range | 範囲チェック | min, max | スライス幅1.8〜2.0mm |
| expiry_date | 期限切れチェック | - | 賞味期限が過去でないか |
| equals | 一致チェック | value | 特定値との一致 |
| pattern | 正規表現 | regex | 入力形式チェック |

### 3.3 バリデーション実装例

```typescript
// lib/validation.ts
export function validateItemValue(
  item: Item,
  value: string | number | null
): { valid: boolean; message?: string } {
  // 必須チェック
  if (item.required && (value === '' || value === null || value === undefined)) {
    return { valid: false, message: 'この項目は必須です' };
  }

  // 値が空の場合、必須でなければOK
  if (value === '' || value === null || value === undefined) {
    return { valid: true };
  }

  // 数値型チェック
  if (item.type === 'number') {
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) {
      return { valid: false, message: '数値を入力してください' };
    }
  }

  // バリデーションルールがない場合
  if (!item.validation) {
    return { valid: true };
  }

  const { type, value: ruleValue, min, max, regex, message } = item.validation;
  const numValue = parseFloat(String(value));

  switch (type) {
    case 'min':
      if (isNaN(numValue) || numValue < ruleValue!) {
        return { valid: false, message: message || `${ruleValue}以上の値を入力してください` };
      }
      break;

    case 'max':
      if (isNaN(numValue) || numValue > ruleValue!) {
        return { valid: false, message: message || `${ruleValue}以下の値を入力してください` };
      }
      break;

    case 'range':
      if (isNaN(numValue) || numValue < min! || numValue > max!) {
        return { valid: false, message: message || `${min}〜${max}の範囲で入力してください` };
      }
      break;

    case 'expiry_date':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(String(value));
      if (inputDate < today) {
        return { valid: false, message: message || '期限切れです' };
      }
      break;

    case 'equals':
      if (value !== ruleValue) {
        return { valid: false, message: message || '値が正しくありません' };
      }
      break;

    case 'pattern':
      const re = new RegExp(regex!);
      if (!re.test(String(value))) {
        return { valid: false, message: message || '入力形式が正しくありません' };
      }
      break;
  }

  return { valid: true };
}
```

### 3.4 レコード完了チェック

```typescript
export function validateRecordCompletion(
  template: Template,
  itemValues: Record<string, ItemValue>
): { valid: boolean; message?: string } {
  const missingItems: string[] = [];
  const invalidItems: string[] = [];

  template.sections.forEach((section) => {
    if (section.repeatable) {
      // 繰り返しセクションの場合、最低1行は必要
      const hasAnyRow = section.items?.some((item) => {
        const value = itemValues[item.item_id];
        return value && value.value !== '';
      });

      if (!hasAnyRow && section.items?.some((item) => item.required)) {
        missingItems.push(section.name);
      }
    } else {
      // 通常セクション
      section.items?.forEach((item) => {
        if (item.required) {
          const value = itemValues[item.item_id];
          if (!value || value.value === '' || value.value === null) {
            missingItems.push(item.label);
          } else if (value.is_valid === false) {
            invalidItems.push(item.label);
          }
        }
      });
    }
  });

  if (missingItems.length > 0) {
    return {
      valid: false,
      message: `未入力の必須項目があります: ${missingItems.slice(0, 3).join(', ')}${missingItems.length > 3 ? '...' : ''}`
    };
  }

  if (invalidItems.length > 0) {
    return {
      valid: false,
      message: `異常値のある項目があります: ${invalidItems.slice(0, 3).join(', ')}${invalidItems.length > 3 ? '...' : ''}`
    };
  }

  return { valid: true };
}
```

---

## 4. ビジネスロジック

### 4.1 ステータス遷移

```
                    ┌─────────────┐
                    │   draft     │ ← 新規作成
                    │  (入力中)   │
                    └──────┬──────┘
                           │ 提出
                           ▼
                    ┌─────────────┐
                    │  submitted  │
                    │ (承認待ち)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │ 承認          │               │ 差戻し
           ▼               │               ▼
    ┌─────────────┐        │        ┌─────────────┐
    │  approved   │        │        │  rejected   │
    │  (承認済)   │        │        │  (差戻し)   │
    └─────────────┘        │        └──────┬──────┘
                           │               │ 再提出
                           │               │
                           └───────────────┘
```

#### 遷移条件

| 遷移 | 実行者 | 条件 |
|------|--------|------|
| draft → submitted | employee / manager | 必須項目がすべて入力済み |
| submitted → approved | manager のみ | - |
| submitted → rejected | manager のみ | 差戻し理由必須 |
| rejected → submitted | employee / manager | 必須項目がすべて入力済み |

### 4.2 権限チェック

```typescript
// lib/auth.ts
export type Role = 'employee' | 'manager';

export interface User {
  user_id: string;
  name: string;
  role: Role;
}

export function canApprove(user: User): boolean {
  return user.role === 'manager';
}

export function canReject(user: User): boolean {
  return user.role === 'manager';
}

export function canEdit(user: User, record: Record): boolean {
  // 下書きまたは差戻しのみ編集可能
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  // 作成者または現在の編集者のみ
  return record.created_by === user.user_id ||
         record.current_editor_id === user.user_id;
}

export function canDelete(user: User, record: Record): boolean {
  // 下書きまたは差戻しのみ削除可能
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  // 作成者、現在の編集者、または管理者
  return record.created_by === user.user_id ||
         record.current_editor_id === user.user_id ||
         user.role === 'manager';
}

export function canTakeOver(user: User, record: Record): boolean {
  // 下書きまたは差戻しで、自分が編集者でない場合
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return false;
  }
  return record.current_editor_id !== user.user_id;
}
```

### 4.3 引き継ぎロジック

```typescript
// 編集者引き継ぎ
export async function takeOverEditing(
  supabase: SupabaseClient,
  recordId: string,
  newEditorId: string
): Promise<{ success: boolean; message?: string }> {
  // 1. レコード取得
  const { data: record, error } = await supabase
    .from('records')
    .select('*')
    .eq('record_id', recordId)
    .single();

  if (error || !record) {
    return { success: false, message: 'レコードが見つかりません' };
  }

  // 2. ステータスチェック
  if (record.status !== 'draft' && record.status !== 'rejected') {
    return { success: false, message: 'このレコードは編集できません' };
  }

  const previousEditor = record.current_editor_id;

  // 3. 編集者更新
  const { error: updateError } = await supabase
    .from('records')
    .update({ current_editor_id: newEditorId })
    .eq('record_id', recordId);

  if (updateError) {
    return { success: false, message: '引き継ぎに失敗しました' };
  }

  // 4. ログ記録
  await supabase.from('operation_logs').insert({
    user_id: newEditorId,
    action: 'take_over',
    target_id: recordId,
    details: { previous_editor: previousEditor }
  });

  return { success: true };
}
```

### 4.4 バッチ番号採番

```typescript
export async function getNextBatchNumber(
  supabase: SupabaseClient,
  productId: string,
  lineId: string,
  productionDate: string
): Promise<number> {
  const { data } = await supabase
    .from('records')
    .select('batch_number')
    .eq('product_id', productId)
    .eq('line_id', lineId)
    .eq('production_date', productionDate)
    .order('batch_number', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return 1;
  }

  return data[0].batch_number + 1;
}
```

### 4.5 レコードID生成

```
R{YYYYMMDD}-{product_id}-{line_id}-{batch_number(3桁)}

例: R20251228-P001-L001-001
```

---

## 5. 画面フロー

### 5.1 画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| Login | `/login` | ログイン画面 |
| Home | `/` | ホーム画面 |
| Create | `/create/[productId]` | バッチ作成画面 |
| Input | `/input/[recordId]` | チェック表入力画面 |
| ApprovalList | `/approval` | 承認待ち一覧 |
| Detail | `/detail/[recordId]` | チェック表詳細（承認画面） |
| Search | `/search` | 履歴検索画面 |
| Print | `/print/[recordId]` | 印刷プレビュー |

### 5.2 画面遷移図

```
                      ┌──────────────────────────────────────────────┐
                      │                                              │
                      │                  Login                       │
                      │                                              │
                      └─────────────────────┬────────────────────────┘
                                            │ ログイン成功
                                            ▼
                      ┌──────────────────────────────────────────────┐
                      │                                              │
                      │                   Home                       │
       ┌──────────────┤  ・製品選択（新規作成）                      │
       │              │  ・入力中一覧（続き入力）                    │
       │              │  ・承認待ちバッジ（管理者のみ）              │
       │              │  ・履歴検索ボタン                            │
       │              │                                              │
       │              └────────┬───────────────────┬─────────────────┘
       │                       │                   │
       │ 製品選択              │ 続き入力          │ 履歴検索
       ▼                       │                   ▼
┌─────────────┐                │            ┌─────────────┐
│   Create    │                │            │   Search    │
│ 製造日・ライン│               │            │ 条件検索    │
│    選択     │                │            └──────┬──────┘
└──────┬──────┘                │                   │
       │ 作成                  │                   │ レコード選択
       ▼                       ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                         Input                            │
│  ・セクション別入力フォーム                              │
│  ・自動保存（項目変更時）                                │
│  ・進捗バー                                              │
│  ・引き継ぎボタン                                        │
│                                                          │
└─────────────────────────────┬────────────────────────────┘
                              │ 提出
                              ▼
                      ┌──────────────────┐
                      │   ApprovalList   │ ← 管理者のみ
                      │   承認待ち一覧   │
                      └────────┬─────────┘
                               │ レコード選択
                               ▼
                      ┌──────────────────┐
                      │     Detail       │
                      │   詳細・承認     │
                      │  ・承認ボタン    │
                      │  ・差戻しボタン  │
                      └────────┬─────────┘
                               │
                      ┌────────┴────────┐
                      │                 │
                      ▼                 ▼
               ┌───────────┐     ┌───────────┐
               │  Print    │     │  Home     │
               │ 印刷PV    │     │ (承認後)  │
               └───────────┘     └───────────┘
```

### 5.3 各画面の役割

#### Login（ログイン画面）
- ユーザー選択（ドロップダウン）
- パスワード入力（マスク表示/非表示切替）
- セッション有効期限: 8時間

#### Home（ホーム画面）
- 製品カード表示（クリックで新規作成へ）
- 入力中/差戻しレコード一覧
  - ステータスバッジ
  - 続き入力ボタン
  - 削除ボタン
- 承認待ち件数バッジ（管理者のみ）
- 履歴検索ボタン

#### Create（バッチ作成画面）
- 製造日選択（デフォルト: 今日）
- 製造ライン選択
- バッチ番号は自動採番

#### Input（チェック表入力画面）
- 動的フォーム生成（テンプレートから）
- 自動保存（onChange時にサーバー保存）
- 進捗バー表示（入力済み項目数/全項目数）
- 差戻し理由アラート表示
- 編集者表示・引き継ぎボタン
- 一時保存ボタン
- 完了して提出ボタン（バリデーション後）

#### ApprovalList（承認待ち一覧）
- 承認待ちレコード一覧
- 製品名、製造日、バッチ番号、提出者名、提出日時

#### Detail（チェック表詳細）
- 入力内容の閲覧
- 異常値ハイライト
- 承認ボタン
- 差戻しボタン（理由入力モーダル）
- 印刷ボタン

#### Search（履歴検索画面）
- 製品フィルター
- 期間フィルター
- ステータスフィルター
- 検索結果一覧

#### Print（印刷プレビュー）
- A4印刷レイアウト
- 紙チェック表を再現

---

## 6. API仕様

### 6.1 認証API

#### POST /api/auth/login
```typescript
// Request
{
  userId: string;
  password: string;
}

// Response (200)
{
  success: true;
  user: {
    user_id: string;
    name: string;
    role: 'employee' | 'manager';
  };
}

// Response (401)
{
  success: false;
  message: 'ユーザーが見つかりません' | 'パスワードが正しくありません';
}
```

#### POST /api/auth/logout
```typescript
// Response (200)
{
  success: true;
}
```

#### GET /api/auth/me
```typescript
// Response (200) - ログイン済み
{
  user_id: string;
  name: string;
  role: 'employee' | 'manager';
}

// Response (401) - 未ログイン
null
```

### 6.2 マスタAPI

#### GET /api/users
```typescript
// Response
{
  user_id: string;
  name: string;
}[]
```

#### GET /api/products
```typescript
// Response
{
  product_id: string;
  name: string;
  icon: string;
  sort_order: number;
}[]
```

#### GET /api/lines
```typescript
// Response
{
  line_id: string;
  name: string;
  sort_order: number;
}[]
```

### 6.3 テンプレートAPI

#### GET /api/templates/[productId]
```typescript
// Response
{
  template_id: string;
  product_id: string;
  version: number;
  sections: Section[];
}
```

### 6.4 レコードAPI

#### POST /api/records
```typescript
// Request
{
  productId: string;
  lineId: string;
  productionDate: string; // YYYY-MM-DD
}

// Response (201)
{
  success: true;
  record_id: string;
}

// Response (400)
{
  success: false;
  message: string;
}
```

#### GET /api/records/[recordId]
```typescript
// Response
{
  record_id: string;
  template_id: string;
  product_id: string;
  product_name: string;
  line_id: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  current_editor_id: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  submitted_by: string;
  submitted_at: string;
  approved_by: string;
  approved_by_name: string;
  approved_at: string;
  rejected_by: string;
  rejected_at: string;
  reject_reason: string;
}
```

#### GET /api/records/draft
```typescript
// Response - ユーザーの下書き/差戻しレコード一覧
{
  record_id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: 'draft' | 'rejected';
  created_by_name: string;
  current_editor_name: string;
}[]
```

#### GET /api/records/submitted
```typescript
// Response - 承認待ちレコード一覧
{
  record_id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  created_by_name: string;
  submitted_at: string;
}[]
```

#### POST /api/records/[recordId]/submit
```typescript
// Response (200)
{
  success: true;
}

// Response (400)
{
  success: false;
  message: '未入力の必須項目があります: ...' | '異常値のある項目があります: ...';
}
```

#### POST /api/records/[recordId]/approve
```typescript
// Response (200)
{
  success: true;
}

// Response (403)
{
  success: false;
  message: '権限がありません';
}
```

#### POST /api/records/[recordId]/reject
```typescript
// Request
{
  reason: string;
}

// Response (200)
{
  success: true;
}

// Response (400)
{
  success: false;
  message: '差戻し理由を入力してください';
}
```

#### POST /api/records/[recordId]/take-over
```typescript
// Response (200)
{
  success: true;
}
```

#### DELETE /api/records/[recordId]
```typescript
// Response (200)
{
  success: true;
  message: '削除しました';
}

// Response (400)
{
  success: false;
  message: '入力中または差戻しのレコードのみ削除できます' | '削除権限がありません';
}
```

### 6.5 入力値API

#### GET /api/records/[recordId]/items
```typescript
// Response
{
  [key: string]: {
    value: string;
    is_valid: boolean;
    input_by: string;
    input_at: string;
  }
}
// keyの形式:
//   - 通常項目: "S1-1"
//   - 繰り返し項目(row 0): "S2-1"
//   - 繰り返し項目(row 1以降): "S2-1_1", "S2-1_2", ...
```

#### POST /api/records/[recordId]/items
```typescript
// Request
{
  itemId: string;
  rowIndex: number;
  value: string;
  isValid: boolean;
}

// Response (200)
{
  success: true;
}
```

### 6.6 検索API

#### GET /api/records/search
```typescript
// Query Parameters
{
  productId?: string;
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  statuses?: string[];   // ['approved', 'submitted']
}

// Response
{
  record_id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: string;
  created_by_name: string;
  approved_by_name: string;
  created_at: string;
  approved_at: string;
}[]
```

### 6.7 エラーハンドリング

#### 共通エラーレスポンス
```typescript
// 認証エラー (401)
{
  success: false;
  message: '認証エラー';
}

// 権限エラー (403)
{
  success: false;
  message: '権限がありません';
}

// Not Found (404)
{
  success: false;
  message: 'レコードが見つかりません';
}

// バリデーションエラー (400)
{
  success: false;
  message: string;
}

// サーバーエラー (500)
{
  success: false;
  message: '処理中にエラーが発生しました';
}
```

---

## 7. 技術スタック推奨

### フロントエンド
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **React Hook Form** + **Zod** (バリデーション)
- **TanStack Query** (データフェッチ)

### バックエンド
- **Supabase**
  - PostgreSQL (データベース)
  - Row Level Security (RLS)
  - Auth (オプション、カスタム認証も可)
  - Realtime (オプション、リアルタイム更新)

### デプロイ
- **Vercel** (フロントエンド)
- **Supabase** (バックエンド)

---

## 8. 移行時の注意事項

### 8.1 データ移行
- スプレッドシートからCSVエクスポート
- Supabaseへのインポート時、日付・時刻の形式変換に注意
- password_hashはSHA-256形式のまま移行可能

### 8.2 認証方式の選択
1. **カスタム認証** (GASと同等)
   - usersテーブルでパスワード管理
   - セッションはCookie/JWT

2. **Supabase Auth**
   - メールアドレスベースの認証
   - usersテーブルとauth.usersを連携

### 8.3 オフライン対応
- GAS版はオンライン必須
- Next.js版ではService Worker + IndexedDBでオフライン対応可能
- Supabase Realtimeで同期

### 8.4 印刷機能
- GAS版: HTMLレンダリング
- Next.js版: @react-pdf/renderer または CSS Print Media

---

## 9. ファイル構成案

```
/app
  /api
    /auth
      /login/route.ts
      /logout/route.ts
      /me/route.ts
    /users/route.ts
    /products/route.ts
    /lines/route.ts
    /templates
      /[productId]/route.ts
    /records
      /route.ts
      /draft/route.ts
      /submitted/route.ts
      /search/route.ts
      /[recordId]
        /route.ts
        /items/route.ts
        /submit/route.ts
        /approve/route.ts
        /reject/route.ts
        /take-over/route.ts
  /(auth)
    /login/page.tsx
  /(main)
    /page.tsx                    # Home
    /create/[productId]/page.tsx
    /input/[recordId]/page.tsx
    /approval/page.tsx
    /detail/[recordId]/page.tsx
    /search/page.tsx
    /print/[recordId]/page.tsx
/components
  /ui                            # shadcn/ui components
  /forms
    /FormRenderer.tsx
    /FieldInput.tsx
    /TableInput.tsx
    /OkNgButton.tsx
    /UserSelect.tsx
    /TimeInput.tsx
  /layout
    /Header.tsx
    /Navigation.tsx
/lib
  /supabase.ts                   # Supabase client
  /auth.ts                       # 認証ユーティリティ
  /validation.ts                 # バリデーション
  /utils.ts                      # 汎用ユーティリティ
/types
  /database.ts                   # DB型定義
  /template.ts                   # テンプレート型定義
  /api.ts                        # API型定義
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-28 | 1.0 | 初版作成 |
