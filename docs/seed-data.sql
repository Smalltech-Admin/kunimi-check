-- =============================================
-- くにみ農産加工 チェック表システム シードデータ
-- Supabase SQL Editorで実行してください
-- =============================================

-- ===== テーブル作成 =====

-- users テーブル
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code VARCHAR(50) UNIQUE
);

-- products テーブル
CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- lines テーブル
CREATE TABLE IF NOT EXISTS lines (
  line_id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- templates テーブル
CREATE TABLE IF NOT EXISTS templates (
  template_id VARCHAR(10) PRIMARY KEY,
  product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
  version INTEGER NOT NULL DEFAULT 1,
  sections_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_templates_product ON templates(product_id, is_active, version DESC);

-- records テーブル
CREATE TABLE IF NOT EXISTS records (
  record_id VARCHAR(50) PRIMARY KEY,
  template_id VARCHAR(10) NOT NULL REFERENCES templates(template_id),
  product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
  line_id VARCHAR(10) NOT NULL,
  production_date DATE NOT NULL,
  batch_number INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  current_editor_id VARCHAR(10),
  created_by VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by VARCHAR(10),
  submitted_at TIMESTAMPTZ,
  approved_by VARCHAR(10),
  approved_at TIMESTAMPTZ,
  rejected_by VARCHAR(10),
  rejected_at TIMESTAMPTZ,
  reject_reason TEXT
);

-- record_items テーブル
CREATE TABLE IF NOT EXISTS record_items (
  id VARCHAR(50) PRIMARY KEY,
  record_id VARCHAR(50) NOT NULL REFERENCES records(record_id),
  section_id VARCHAR(10) NOT NULL,
  item_id VARCHAR(20) NOT NULL,
  row_index INTEGER NOT NULL DEFAULT 0,
  value TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  input_by VARCHAR(10),
  input_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(10),
  updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_record_items_record ON record_items(record_id);

-- item_change_logs テーブル
CREATE TABLE IF NOT EXISTS item_change_logs (
  id VARCHAR(50) PRIMARY KEY,
  record_id VARCHAR(50) NOT NULL REFERENCES records(record_id),
  section_id VARCHAR(10) NOT NULL,
  item_id VARCHAR(20) NOT NULL,
  row_index INTEGER NOT NULL DEFAULT 0,
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(10) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_type VARCHAR(10) NOT NULL CHECK (change_type IN ('create', 'update'))
);
CREATE INDEX IF NOT EXISTS idx_change_logs_record ON item_change_logs(record_id);

-- operation_logs テーブル
CREATE TABLE IF NOT EXISTS operation_logs (
  log_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(10),
  action VARCHAR(100) NOT NULL,
  target_id VARCHAR(50),
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== マスタデータ投入 =====

-- ユーザー
INSERT INTO users (user_id, name, password_hash, role, is_active, qr_code) VALUES
  ('U001', '山田 太郎', '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9', 'manager', true, 'QR-U001'),
  ('U002', '佐藤 花子', '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9', 'employee', true, 'QR-U002'),
  ('U003', '鈴木 一郎', '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9', 'employee', true, 'QR-U003'),
  ('U004', '田中 美咲', '5e884898da28047d55d175c84679f8a7f9f4e9f9f9f9f9f9f9f9f9f9f9f9f9f9', 'employee', true, 'QR-U004')
ON CONFLICT (user_id) DO NOTHING;

-- 製品
INSERT INTO products (product_id, name, icon, sort_order, is_active) VALUES
  ('P001', '大葉ミンチ', '🌿', 1, true),
  ('P004', 'フライドガーリック', '🧄', 2, true)
ON CONFLICT (product_id) DO NOTHING;

-- 製造ライン
INSERT INTO lines (line_id, name, sort_order, is_active) VALUES
  ('L001', '第1ライン', 1, true),
  ('L002', '第2ライン', 2, true)
ON CONFLICT (line_id) DO NOTHING;

-- ===== テンプレート投入 =====

-- 大葉ミンチ用テンプレート (P001)
INSERT INTO templates (template_id, product_id, version, sections_json, is_active) VALUES
  ('T001', 'P001', 1, '[
    {
      "section_id": "S1",
      "name": "基本情報",
      "description": "製造日・担当者・賞味期限を入力",
      "items": [
        {"item_id": "S1-1", "label": "製造日", "type": "date", "required": true},
        {"item_id": "S1-2", "label": "担当者", "type": "user_select", "required": true, "allow_self": true},
        {"item_id": "S1-3", "label": "賞味期限", "type": "date", "required": true, "hint": "360日後", "validation": {"type": "expiry_date", "message": "賞味期限が過去の日付です"}}
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
        {"item_id": "S12-1", "label": "状態", "type": "ok_ng", "required": true, "labels": {"ok": "良", "ng": "不良"}},
        {"item_id": "S12-2", "label": "時間", "type": "time", "required": true, "allow_now_button": true},
        {"item_id": "S12-3", "label": "確認者", "type": "user_select", "required": true, "allow_self": true}
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
        {"item_id": "S2-1", "label": "大葉", "type": "ok_ng", "required": true, "hint": "10kg", "labels": {"ok": "✓", "ng": "−"}},
        {"item_id": "S2-2", "label": "製造水", "type": "ok_ng", "required": true, "hint": "10kg", "labels": {"ok": "✓", "ng": "−"}}
      ]
    },
    {
      "section_id": "S9",
      "name": "シール強度確認",
      "items": [
        {"item_id": "S9-1", "label": "シール強度（前）", "type": "number", "required": true, "unit": "kgf", "validation": {"type": "min", "value": 3.5, "message": "シール強度は3.5kgf以上必要です"}},
        {"item_id": "S9-2", "label": "確認時刻", "type": "time", "required": true, "allow_now_button": true},
        {"item_id": "S9-3", "label": "確認者", "type": "user_select", "required": true, "allow_self": true}
      ]
    },
    {
      "section_id": "S20",
      "name": "チラー温度【開始時】",
      "items": [
        {"item_id": "S20-1", "label": "温度", "type": "number", "required": true, "unit": "℃", "validation": {"type": "max", "value": 10, "message": "チラー温度は10℃以下が必要です"}},
        {"item_id": "S20-2", "label": "確認時刻", "type": "time", "required": true, "allow_now_button": true}
      ]
    }
  ]'::jsonb, true)
ON CONFLICT (template_id) DO UPDATE SET
  sections_json = EXCLUDED.sections_json,
  is_active = EXCLUDED.is_active;

-- ※ 完全版テンプレート（大葉ミンチ・フライドガーリック）は migrate-templates.sql を参照

-- ===== RLS (Row Level Security) 設定 =====
-- 開発段階ではRLSを無効化（全アクセス許可）

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- 開発用：全テーブルにanonキーでのフルアクセスを許可
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON lines FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON records FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON record_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON item_change_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for anon" ON operation_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- ===== 確認用クエリ =====
-- SELECT * FROM users;
-- SELECT * FROM products;
-- SELECT * FROM lines;
-- SELECT * FROM templates;
-- SELECT template_id, product_id, version, is_active, jsonb_array_length(sections_json) as section_count FROM templates;
