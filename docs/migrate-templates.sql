-- =============================================
-- GASテンプレート → Supabase移行SQL
-- 生成日時: 2026-01-31T07:44:53.775Z
-- =============================================

-- ===== Step 1: フライドガーリックを製品マスタに追加 =====
INSERT INTO products (product_code, name, icon, sort_order, is_active)
VALUES ('P004', 'フライドガーリック', '🧄', 4, true)
ON CONFLICT (product_code) DO NOTHING;

-- ===== Step 2: 大葉ミンチ テンプレート更新 =====
-- product_code = 'P001' の product_id (UUID) を使って更新
UPDATE templates
SET sections = '[
  {
    "id": "S1",
    "name": "基本情報",
    "description": "製造日・担当者・賞味期限を入力",
    "items": [
      {
        "id": "S1-1",
        "label": "製造日",
        "type": "date",
        "required": true
      },
      {
        "id": "S1-2",
        "label": "担当者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S1-3",
        "label": "賞味期限",
        "type": "date",
        "required": true,
        "hint": "360日後",
        "validation": {
          "type": "expiry_date",
          "message": "賞味期限が過去の日付です"
        }
      },
      {
        "id": "S1-3-photo",
        "label": "賞味期限写真",
        "type": "photo",
        "required": true
      },
      {
        "id": "S1-4",
        "label": "賞味期限確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S1-5",
        "label": "Wチェック者",
        "type": "user_select",
        "required": true,
        "allow_self": false
      }
    ]
  },
  {
    "id": "S12",
    "name": "フィルター確認【開始前】",
    "repeatable": true,
    "min_rows": 5,
    "max_rows": 5,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": [
      "①水槽（次亜混合）",
      "②水槽（洗浄）",
      "③シンク",
      "④水槽（出口）",
      "⑤補水"
    ],
    "items": [
      {
        "id": "S12-1",
        "label": "状態",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "良",
          "ng": "不良"
        }
      },
      {
        "id": "S12-2",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S12-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S15",
    "name": "使用備品点検【開始前】",
    "repeatable": true,
    "min_rows": 8,
    "max_rows": 8,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": [
      "脱水用ザルかご",
      "水槽",
      "樹脂タンク",
      "ステンレス網",
      "ステンレスお盆",
      "ピンセット",
      "スコップ",
      "ヘラ"
    ],
    "items": [
      {
        "id": "S15-1",
        "label": "状態",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "良",
          "ng": "不良"
        }
      },
      {
        "id": "S15-2",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S15-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S13",
    "name": "使用設備点検＜コミットロール＞",
    "items": [
      {
        "id": "S13-1",
        "label": "使用刃の確認",
        "type": "text",
        "required": true,
        "hint": "3mmカット"
      },
      {
        "id": "S13-2",
        "label": "運転時の異常音（開始前）",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S13-3",
        "label": "異常音確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S13-4",
        "label": "異物付着の有無（開始前）",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S13-5",
        "label": "異物確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S14",
    "name": "カッティングヘッド・インペラー（刃の欠け有無）",
    "description": "※刃の欠けを発見した場合は、直ちに作業を中止し連絡すること！"
  },
  {
    "id": "S14-B",
    "name": "【開始前】刃の欠け確認",
    "items": [
      {
        "id": "S14-B1",
        "label": "カッティングヘッド",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-B2",
        "label": "インペラー",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-B3",
        "label": "ネジ確認",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-BT",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S14-BC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S14-M",
    "name": "【中間時】刃の欠け確認",
    "items": [
      {
        "id": "S14-M1",
        "label": "カッティングヘッド",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-M2",
        "label": "インペラー",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-MT",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S14-MC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S14-E",
    "name": "【終了時】刃の欠け確認",
    "items": [
      {
        "id": "S14-E1",
        "label": "カッティングヘッド",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-E2",
        "label": "インペラー",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-E3",
        "label": "ネジ確認",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S14-ET",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S14-EC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S11",
    "name": "虫取りマグネット確認",
    "description": "異物付着の有無を確認"
  },
  {
    "id": "S11-B",
    "name": "【開始前】虫取りマグネット",
    "items": [
      {
        "id": "S11-B1",
        "label": "異物付着の有無",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S11-BT",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S11-BC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S11-E",
    "name": "【終了時】虫取りマグネット",
    "items": [
      {
        "id": "S11-E1",
        "label": "異物付着の有無",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S11-ET",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S11-EC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S16",
    "name": "クロール試験紙使用期限",
    "items": [
      {
        "id": "S16-1",
        "label": "使用期限（年）",
        "type": "number",
        "required": true
      },
      {
        "id": "S16-2",
        "label": "使用期限（月）",
        "type": "number",
        "required": true,
        "validation": {
          "type": "range",
          "min": 1,
          "max": 12,
          "message": "1〜12の月を入力してください"
        }
      }
    ]
  },
  {
    "id": "S9",
    "name": "シール強度確認",
    "items": [
      {
        "id": "S9-1",
        "label": "シール機No",
        "type": "text",
        "required": true
      },
      {
        "id": "S9-2",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S9-start",
    "name": "シール強度確認【作業開始時】",
    "items": [
      {
        "id": "S9-S1",
        "label": "加熱時間",
        "type": "time",
        "required": true,
        "allow_now_button": false
      },
      {
        "id": "S9-S2",
        "label": "冷却時間",
        "type": "time",
        "required": true,
        "allow_now_button": false
      },
      {
        "id": "S9-S3",
        "label": "シール強度",
        "type": "number",
        "required": true,
        "hint": "3.5以上",
        "validation": {
          "type": "min",
          "value": 3.5,
          "message": "シール強度は3.5以上必要です"
        }
      },
      {
        "id": "S9-S4",
        "label": "Wチェック者",
        "type": "user_select",
        "required": true,
        "allow_self": false
      }
    ]
  },
  {
    "id": "S10",
    "name": "シール機設定詳細",
    "items": [
      {
        "id": "S10-1",
        "label": "加熱時間設定",
        "type": "number",
        "required": true,
        "hint": "0.8"
      },
      {
        "id": "S10-2",
        "label": "冷却時間設定",
        "type": "number",
        "required": true,
        "hint": "1.6"
      }
    ]
  },
  {
    "id": "S22",
    "name": "計測器確認",
    "items": [
      {
        "id": "S22-1",
        "label": "計測器No",
        "type": "text",
        "required": true
      },
      {
        "id": "S22-2",
        "label": "標準分銅（5kg・1kg）確認",
        "type": "number",
        "unit": "g",
        "required": true
      },
      {
        "id": "S22-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S23",
    "name": "風袋重量確認",
    "items": [
      {
        "id": "S23-1",
        "label": "風袋重量",
        "type": "number",
        "unit": "g",
        "required": true
      },
      {
        "id": "S23-2",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S23-3",
        "label": "Wチェック者",
        "type": "user_select",
        "required": true,
        "allow_self": false
      }
    ]
  },
  {
    "id": "S20",
    "name": "新チラー温度確認",
    "description": "設定温度5℃、実測温度10℃以下"
  },
  {
    "id": "S20-B",
    "name": "【開始時】チラー温度",
    "items": [
      {
        "id": "S20-B1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S20-B2",
        "label": "実測温度",
        "type": "number",
        "unit": "℃",
        "required": true,
        "hint": "10℃以下",
        "validation": {
          "type": "max",
          "value": 10,
          "message": "実測温度は10℃以下である必要があります"
        }
      },
      {
        "id": "S20-BC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S20-E",
    "name": "【終了時】チラー温度",
    "items": [
      {
        "id": "S20-E1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S20-E2",
        "label": "実測温度",
        "type": "number",
        "unit": "℃",
        "required": true,
        "hint": "10℃以下",
        "validation": {
          "type": "max",
          "value": 10,
          "message": "実測温度は10℃以下である必要があります"
        }
      },
      {
        "id": "S20-EC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S2",
    "name": "配合確認（1-15回目）",
    "description": "大葉10kg、製造水10kgの配合を確認",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 15,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S2-1",
        "label": "大葉",
        "type": "ok_ng",
        "required": true,
        "hint": "10kg",
        "labels": {
          "ok": "✓",
          "ng": "−"
        }
      },
      {
        "id": "S2-2",
        "label": "製造水",
        "type": "ok_ng",
        "required": true,
        "hint": "10kg",
        "labels": {
          "ok": "✓",
          "ng": "−"
        }
      }
    ]
  },
  {
    "id": "S2-confirm",
    "name": "配合確認者（1-15回目）",
    "items": [
      {
        "id": "S2-C1",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S7",
    "name": "配合確認（16-30回目）",
    "description": "大葉10kg、製造水10kgの配合を確認",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 15,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S7-1",
        "label": "大葉",
        "type": "ok_ng",
        "required": false,
        "hint": "10kg",
        "labels": {
          "ok": "✓",
          "ng": "−"
        }
      },
      {
        "id": "S7-2",
        "label": "製造水",
        "type": "ok_ng",
        "required": false,
        "hint": "10kg",
        "labels": {
          "ok": "✓",
          "ng": "−"
        }
      }
    ]
  },
  {
    "id": "S7-confirm",
    "name": "配合確認者（16-30回目）",
    "items": [
      {
        "id": "S7-C1",
        "label": "確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S3",
    "name": "次亜塩素酸殺菌確認（1-15回目）",
    "description": "※3回に1回入れ替え",
    "items": [
      {
        "id": "S3-1",
        "label": "次亜塩素酸ナトリウム配合量",
        "type": "number",
        "unit": "mL",
        "required": true,
        "hint": "目安550mL"
      },
      {
        "id": "S3-2",
        "label": "製造水",
        "type": "number",
        "unit": "L",
        "required": true,
        "hint": "200L"
      }
    ]
  },
  {
    "id": "S3-time",
    "name": "殺菌時間記録（1-15回目）",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 15,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S3-T1",
        "label": "開始",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S3-T2",
        "label": "終了",
        "type": "time",
        "required": true,
        "allow_now_button": true
      }
    ]
  },
  {
    "id": "S3-ppm",
    "name": "濃度確認（1-15回目）",
    "items": [
      {
        "id": "S3-P1",
        "label": "300ppm以上確認（作成時）",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "確認済",
          "ng": "未確認"
        }
      },
      {
        "id": "S3-P2",
        "label": "200ppm以上確認（排水時）",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "確認済",
          "ng": "未確認"
        }
      },
      {
        "id": "S3-P3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S8",
    "name": "次亜塩素酸殺菌確認（16-30回目）",
    "description": "※3回に1回入れ替え",
    "items": [
      {
        "id": "S8-1",
        "label": "次亜塩素酸ナトリウム配合量",
        "type": "number",
        "unit": "mL",
        "required": false,
        "hint": "目安550mL"
      },
      {
        "id": "S8-2",
        "label": "製造水",
        "type": "number",
        "unit": "L",
        "required": false,
        "hint": "200L"
      }
    ]
  },
  {
    "id": "S8-time",
    "name": "殺菌時間記録（16-30回目）",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 15,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S8-T1",
        "label": "開始",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S8-T2",
        "label": "終了",
        "type": "time",
        "required": false,
        "allow_now_button": true
      }
    ]
  },
  {
    "id": "S8-ppm",
    "name": "濃度確認（16-30回目）",
    "items": [
      {
        "id": "S8-P1",
        "label": "300ppm以上確認（作成時）",
        "type": "ok_ng",
        "required": false,
        "labels": {
          "ok": "確認済",
          "ng": "未確認"
        }
      },
      {
        "id": "S8-P2",
        "label": "200ppm以上確認（排水時）",
        "type": "ok_ng",
        "required": false,
        "labels": {
          "ok": "確認済",
          "ng": "未確認"
        }
      },
      {
        "id": "S8-P3",
        "label": "確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S17",
    "name": "【大葉ボイルチェック表】基本情報",
    "description": "ボイル工程の記録",
    "items": [
      {
        "id": "S17-1",
        "label": "製造日",
        "type": "date",
        "required": true
      },
      {
        "id": "S17-2",
        "label": "賞味期限",
        "type": "date",
        "required": true,
        "validation": {
          "type": "expiry_date",
          "message": "賞味期限が過去の日付です"
        }
      },
      {
        "id": "S17-3",
        "label": "作業者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S18",
    "name": "ボイル時間/製品温度確認",
    "description": "※製品温度確認: ○℃以上○分を確認すること！",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 4,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S18-1",
        "label": "製品投入時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S18-2",
        "label": "投入前製品品温",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S18-3",
        "label": "製品投入後ボイル槽温度",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S18-4",
        "label": "殺菌開始時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S18-5",
        "label": "殺菌終了時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S18-6",
        "label": "設定温度確認",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S18-7",
        "label": "製品温度確認",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S18-8",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S19",
    "name": "冷却確認",
    "description": "※60分以内に40℃以下に冷却する",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 4,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S19-1",
        "label": "開始時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S19-2",
        "label": "終了時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S19-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S21",
    "name": "台車別管理",
    "items": [
      {
        "id": "S21-1",
        "label": "製品名",
        "type": "text",
        "required": true
      },
      {
        "id": "S21-2",
        "label": "計量値（風袋込み）",
        "type": "number",
        "unit": "kg",
        "required": true
      }
    ]
  },
  {
    "id": "S21-cart",
    "name": "台車別記録",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 13,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S21-C1",
        "label": "台車No",
        "type": "number",
        "required": true
      },
      {
        "id": "S21-C2",
        "label": "凍結開始時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S21-C3",
        "label": "冷却後温度",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S21-C4",
        "label": "数量",
        "type": "number",
        "required": true
      },
      {
        "id": "S21-C5",
        "label": "計量重量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S21-C6",
        "label": "累計",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S21-C7",
        "label": "積み付け作業者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S21-fraction",
    "name": "端数",
    "items": [
      {
        "id": "S21-F1",
        "label": "端数",
        "type": "number",
        "unit": "kg",
        "required": false
      },
      {
        "id": "S21-F2",
        "label": "備考",
        "type": "text",
        "required": false
      }
    ]
  },
  {
    "id": "S12-end",
    "name": "フィルター確認【終了時】",
    "repeatable": true,
    "min_rows": 5,
    "max_rows": 5,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": [
      "①水槽（次亜混合）",
      "②水槽（洗浄）",
      "③シンク",
      "④水槽（出口）",
      "⑤補水"
    ],
    "items": [
      {
        "id": "S12E-1",
        "label": "状態",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "良",
          "ng": "不良"
        }
      },
      {
        "id": "S12E-2",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S12E-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S15-end",
    "name": "使用備品点検【終了時】",
    "repeatable": true,
    "min_rows": 8,
    "max_rows": 8,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": [
      "脱水用ザルかご",
      "水槽",
      "樹脂タンク",
      "ステンレス網",
      "ステンレスお盆",
      "ピンセット",
      "スコップ",
      "ヘラ"
    ],
    "items": [
      {
        "id": "S15E-1",
        "label": "状態",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "良",
          "ng": "不良"
        }
      },
      {
        "id": "S15E-2",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S15E-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S9-end",
    "name": "シール強度確認【作業終了時】",
    "items": [
      {
        "id": "S9-E1",
        "label": "加熱時間",
        "type": "time",
        "required": true,
        "allow_now_button": false
      },
      {
        "id": "S9-E2",
        "label": "冷却時間",
        "type": "time",
        "required": true,
        "allow_now_button": false
      },
      {
        "id": "S9-E3",
        "label": "シール強度",
        "type": "number",
        "required": true,
        "hint": "3.5以上",
        "validation": {
          "type": "min",
          "value": 3.5,
          "message": "シール強度は3.5以上必要です"
        }
      },
      {
        "id": "S9-E4",
        "label": "Wチェック者",
        "type": "user_select",
        "required": true,
        "allow_self": false
      }
    ]
  },
  {
    "id": "S4",
    "name": "大葉原料処理量",
    "items": [
      {
        "id": "S4-1",
        "label": "処理量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S4-2",
        "label": "入荷日",
        "type": "date",
        "required": true
      }
    ]
  },
  {
    "id": "S5",
    "name": "使用資材",
    "description": "404029 大葉ミンチ用三方袋（ピンク）",
    "items": [
      {
        "id": "S5-1",
        "label": "不良枚数",
        "type": "number",
        "unit": "枚",
        "required": true
      },
      {
        "id": "S5-2",
        "label": "使用枚数",
        "type": "number",
        "unit": "枚",
        "required": true
      },
      {
        "id": "S5-3",
        "label": "合計枚数",
        "type": "number",
        "unit": "枚",
        "required": true
      }
    ]
  },
  {
    "id": "S6",
    "name": "製品出来高",
    "items": [
      {
        "id": "S6-1",
        "label": "製品出来高合計",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S6-2",
        "label": "内容量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S6-3",
        "label": "ケース数",
        "type": "number",
        "unit": "c/s",
        "required": true
      }
    ]
  }
]'::jsonb,
    version = 2
WHERE product_id = (SELECT id FROM products WHERE product_code = 'P001')
  AND is_active = true;

-- ===== Step 3: フライドガーリック テンプレート作成 =====
INSERT INTO templates (product_id, version, sections, is_active)
VALUES (
  (SELECT id FROM products WHERE product_code = 'P004'),
  1,
  '[
  {
    "id": "S1",
    "name": "基本情報",
    "description": "製造日・作業者・フライ時間を記録",
    "items": [
      {
        "id": "S1-1",
        "label": "製造日",
        "type": "date",
        "required": true
      },
      {
        "id": "S1-2",
        "label": "作業者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S1-3",
        "label": "フライ開始時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S1-4",
        "label": "フライ終了時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S1-5",
        "label": "にんにく産地",
        "type": "text",
        "required": true
      }
    ]
  },
  {
    "id": "S8",
    "name": "使用設備点検【開始前】",
    "repeatable": true,
    "min_rows": 6,
    "max_rows": 6,
    "columns_layout": "horizontal_scroll",
    "fixed_labels": [
      "スライサー",
      "フライヤー",
      "にんにく洗浄機",
      "にんにく投入機",
      "冷却コンベア",
      "脱水カゴ"
    ],
    "items": [
      {
        "id": "S8-1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S8-2",
        "label": "OK?",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "OK",
          "ng": "NG"
        }
      },
      {
        "id": "S8-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S9",
    "name": "設備点検詳細",
    "description": "各設備の詳細点検項目",
    "items": [
      {
        "id": "S9-1",
        "label": "スライサー・刃の欠けがないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-2",
        "label": "スライサー・ネジの緩みはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-3",
        "label": "スライサー・異常音は無いか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-4",
        "label": "フライヤー・異常音は無いか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-5",
        "label": "フライヤー・チェーンの張り",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "良好",
          "ng": "要調整"
        }
      },
      {
        "id": "S9-6",
        "label": "にんにく洗浄機・ベルトの解れはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-7",
        "label": "にんにく洗浄機・異常音は無いか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-8",
        "label": "にんにく投入機・ベルトの解れはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-9",
        "label": "にんにく投入機・ネジの緩みはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-10",
        "label": "冷却コンベア・ベルトの解れはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-11",
        "label": "冷却コンベア・ネジの緩みはないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S9-12",
        "label": "脱水カゴ・破損等はないか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      }
    ]
  },
  {
    "id": "S10",
    "name": "マグトラ確認",
    "description": "6000ガウス以上"
  },
  {
    "id": "S10-B",
    "name": "【開始時】マグトラ",
    "items": [
      {
        "id": "S10-B1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S10-B2",
        "label": "異物の有無",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S10-BC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S10-M",
    "name": "【中間時】マグトラ",
    "items": [
      {
        "id": "S10-M1",
        "label": "確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S10-M2",
        "label": "異物の有無",
        "type": "ok_ng",
        "required": false,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S10-MC",
        "label": "確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S10-E",
    "name": "【終了時】マグトラ",
    "items": [
      {
        "id": "S10-E1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S10-E2",
        "label": "異物の有無",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "無",
          "ng": "有"
        }
      },
      {
        "id": "S10-EC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S6",
    "name": "油の状況確認",
    "description": "異常があれば状態を記入（クズが多い・良好等）",
    "items": [
      {
        "id": "S6-1",
        "label": "油の状況",
        "type": "select",
        "options": [
          "新油",
          "2日目",
          "半新油"
        ],
        "required": true
      },
      {
        "id": "S6-2",
        "label": "状態詳細・備考",
        "type": "text",
        "required": false,
        "hint": "クズが多い・良好等"
      },
      {
        "id": "S6-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S11",
    "name": "出口品温確認",
    "description": "○℃以上"
  },
  {
    "id": "S11-B",
    "name": "【開始時】出口品温",
    "items": [
      {
        "id": "S11-B1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S11-B2",
        "label": "温度",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S11-BC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S11-M",
    "name": "【中間時】出口品温",
    "items": [
      {
        "id": "S11-M1",
        "label": "確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S11-M2",
        "label": "温度",
        "type": "number",
        "unit": "℃",
        "required": false
      },
      {
        "id": "S11-MC",
        "label": "確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S11-E",
    "name": "【終了時】出口品温",
    "items": [
      {
        "id": "S11-E1",
        "label": "確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S11-E2",
        "label": "温度",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S11-EC",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S2",
    "name": "点検項目（午前）",
    "description": "午前の点検記録",
    "items": [
      {
        "id": "S2-1",
        "label": "にんにくスライス幅",
        "type": "number",
        "unit": "mm",
        "required": true,
        "hint": "1.8～2.0mm",
        "validation": {
          "type": "range",
          "min": 1.8,
          "max": 2,
          "message": "スライス幅は1.8～2.0mmの範囲で入力してください"
        }
      },
      {
        "id": "S2-1T",
        "label": "スライス幅確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-1C",
        "label": "スライス幅確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-2",
        "label": "脱水機時間",
        "type": "text",
        "required": true,
        "hint": "1分～1分30秒"
      },
      {
        "id": "S2-2T",
        "label": "脱水機確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-2C",
        "label": "脱水機確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-3",
        "label": "配合量・にんにく",
        "type": "number",
        "unit": "kg",
        "required": true,
        "hint": "6kg"
      },
      {
        "id": "S2-3T",
        "label": "にんにく配合確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-3C",
        "label": "にんにく配合確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-4",
        "label": "配合量・マロン粉",
        "type": "number",
        "unit": "g",
        "required": true,
        "hint": "90g"
      },
      {
        "id": "S2-4T",
        "label": "マロン粉配合確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-4C",
        "label": "マロン粉配合確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-5",
        "label": "フライヤー投入温度・設定値",
        "type": "number",
        "unit": "℃",
        "required": true,
        "hint": "○～○℃(目安)"
      },
      {
        "id": "S2-6",
        "label": "フライヤー投入温度・実測値",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S2-5T",
        "label": "投入温度確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-5C",
        "label": "投入温度確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-7",
        "label": "フライヤー出口温度・設定値",
        "type": "number",
        "unit": "℃",
        "required": true,
        "hint": "○～○℃(目安)"
      },
      {
        "id": "S2-8",
        "label": "フライヤー出口温度・実測値",
        "type": "number",
        "unit": "℃",
        "required": true
      },
      {
        "id": "S2-7T",
        "label": "出口温度確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-7C",
        "label": "出口温度確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-9",
        "label": "フライ時間",
        "type": "text",
        "required": true,
        "hint": "○～○分"
      },
      {
        "id": "S2-9T",
        "label": "フライ時間確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-9C",
        "label": "フライ時間確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      },
      {
        "id": "S2-10",
        "label": "フライ後の外観色確認",
        "type": "select",
        "options": [
          "2",
          "3",
          "4"
        ],
        "required": true,
        "hint": "色見本2～4"
      },
      {
        "id": "S2-10T",
        "label": "外観色確認時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S2-10C",
        "label": "外観色確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S3",
    "name": "点検項目（午後）",
    "description": "午後の点検記録",
    "items": [
      {
        "id": "S3-1",
        "label": "にんにくスライス幅",
        "type": "number",
        "unit": "mm",
        "required": false,
        "hint": "1.8～2.0mm",
        "validation": {
          "type": "range",
          "min": 1.8,
          "max": 2,
          "message": "スライス幅は1.8～2.0mmの範囲で入力してください"
        }
      },
      {
        "id": "S3-1T",
        "label": "スライス幅確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-1C",
        "label": "スライス幅確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-2",
        "label": "脱水機時間",
        "type": "text",
        "required": false,
        "hint": "1分～1分30秒"
      },
      {
        "id": "S3-2T",
        "label": "脱水機確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-2C",
        "label": "脱水機確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-3",
        "label": "配合量・にんにく",
        "type": "number",
        "unit": "kg",
        "required": false,
        "hint": "6kg"
      },
      {
        "id": "S3-3T",
        "label": "にんにく配合確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-3C",
        "label": "にんにく配合確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-4",
        "label": "配合量・マロン粉",
        "type": "number",
        "unit": "g",
        "required": false,
        "hint": "90g"
      },
      {
        "id": "S3-4T",
        "label": "マロン粉配合確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-4C",
        "label": "マロン粉配合確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-5",
        "label": "フライヤー投入温度・設定値",
        "type": "number",
        "unit": "℃",
        "required": false
      },
      {
        "id": "S3-6",
        "label": "フライヤー投入温度・実測値",
        "type": "number",
        "unit": "℃",
        "required": false
      },
      {
        "id": "S3-5T",
        "label": "投入温度確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-5C",
        "label": "投入温度確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-7",
        "label": "フライヤー出口温度・設定値",
        "type": "number",
        "unit": "℃",
        "required": false
      },
      {
        "id": "S3-8",
        "label": "フライヤー出口温度・実測値",
        "type": "number",
        "unit": "℃",
        "required": false
      },
      {
        "id": "S3-7T",
        "label": "出口温度確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-7C",
        "label": "出口温度確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-9",
        "label": "フライ時間",
        "type": "text",
        "required": false
      },
      {
        "id": "S3-9T",
        "label": "フライ時間確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-9C",
        "label": "フライ時間確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      },
      {
        "id": "S3-10",
        "label": "フライ後の外観色確認",
        "type": "select",
        "options": [
          "2",
          "3",
          "4"
        ],
        "required": false,
        "hint": "色見本2～4"
      },
      {
        "id": "S3-10T",
        "label": "外観色確認時間",
        "type": "time",
        "required": false,
        "allow_now_button": true
      },
      {
        "id": "S3-10C",
        "label": "外観色確認者",
        "type": "user_select",
        "required": false,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S12",
    "name": "水分値確認",
    "description": "1.5%以下(目安)／温度、フライ時間変更時に計測",
    "repeatable": true,
    "min_rows": 1,
    "max_rows": 8,
    "columns_layout": "horizontal_scroll",
    "items": [
      {
        "id": "S12-1",
        "label": "時間",
        "type": "time",
        "required": true,
        "allow_now_button": true
      },
      {
        "id": "S12-2",
        "label": "水分値",
        "type": "number",
        "unit": "%",
        "required": true,
        "hint": "1.5%以下",
        "validation": {
          "type": "max",
          "value": 1.5,
          "message": "水分値は1.5%以下である必要があります"
        }
      },
      {
        "id": "S12-3",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S7",
    "name": "終了時点検項目",
    "items": [
      {
        "id": "S7-1",
        "label": "ガスの元栓を閉めたか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "閉めた",
          "ng": "未確認"
        }
      },
      {
        "id": "S7-2",
        "label": "ヒーター類は入っているか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "確認済",
          "ng": "未確認"
        }
      },
      {
        "id": "S7-3",
        "label": "油タンクのバルブコックは閉まっているか",
        "type": "ok_ng",
        "required": true,
        "labels": {
          "ok": "閉まっている",
          "ng": "未確認"
        }
      },
      {
        "id": "S7-4",
        "label": "確認者",
        "type": "user_select",
        "required": true,
        "allow_self": true
      }
    ]
  },
  {
    "id": "S4",
    "name": "使用量",
    "description": "原材料の使用量と入荷日・賞味期限を記録",
    "items": [
      {
        "id": "S4-1",
        "label": "パーム油使用量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S4-2",
        "label": "パーム油入荷日",
        "type": "date",
        "required": true
      },
      {
        "id": "S4-3",
        "label": "にんにく使用量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S4-4",
        "label": "にんにく入荷日",
        "type": "date",
        "required": true
      },
      {
        "id": "S4-5",
        "label": "マロン粉使用量",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S4-6",
        "label": "マロン粉賞味期限",
        "type": "date",
        "required": true,
        "validation": {
          "type": "expiry_date",
          "message": "賞味期限が過去の日付です"
        }
      }
    ]
  },
  {
    "id": "S5",
    "name": "製品出来高・使用資材",
    "items": [
      {
        "id": "S5-1",
        "label": "製品出来高",
        "type": "number",
        "unit": "kg",
        "required": true
      },
      {
        "id": "S5-2",
        "label": "缶数",
        "type": "number",
        "unit": "缶",
        "required": true
      },
      {
        "id": "S5-3",
        "label": "端数",
        "type": "number",
        "unit": "kg",
        "required": false
      },
      {
        "id": "S5-4",
        "label": "800ポリ使用枚数",
        "type": "number",
        "unit": "枚",
        "required": true
      },
      {
        "id": "S5-5",
        "label": "歩留まり",
        "type": "number",
        "unit": "%",
        "required": true
      }
    ]
  },
  {
    "id": "S13",
    "name": "備考",
    "items": [
      {
        "id": "S13-1",
        "label": "備考",
        "type": "text",
        "required": false
      }
    ]
  }
]'::jsonb,
  true
);

-- ===== 確認クエリ =====
-- SELECT t.id, p.name as product_name, t.version, jsonb_array_length(t.sections) as section_count
-- FROM templates t
-- JOIN products p ON t.product_id = p.id
-- WHERE t.is_active = true;
