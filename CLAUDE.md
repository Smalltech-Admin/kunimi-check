# プロジェクト: くにみ農産加工 チェック表システム

## リポジトリ情報

| 項目 | 値 |
|------|-----|
| リポジトリ | ローカル開発 |
| ブランチ | main |
| ローカルパス | 05_チェック表管理システム/01_Kunimi-check-Next |

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| バックエンド | Supabase (PostgreSQL + Auth + Realtime) |
| 認証 | カスタム認証 (QRコード + パスワード) |
| PWA | next-pwa |
| QRコード | html5-qrcode |
| アニメーション | framer-motion |

## 環境変数

| 変数名 | 説明 |
|--------|------|
| NEXT_PUBLIC_SUPABASE_URL | SupabaseプロジェクトURL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase匿名キー |
| SESSION_SECRET | セッション暗号化キー（32文字以上） |

## 開発サーバー

```bash
npm run dev
# http://localhost:3000
```

## プロジェクト構造

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # 認証API
│   │   ├── users/              # ユーザーマスタAPI
│   │   ├── products/           # 製品マスタAPI
│   │   ├── lines/              # ラインマスタAPI
│   │   ├── templates/          # テンプレートAPI
│   │   └── records/            # レコードAPI
│   ├── (auth)/                 # 認証画面グループ
│   │   └── login/              # ログイン画面
│   └── (main)/                 # メイン画面グループ
│       ├── page.tsx            # ホーム画面
│       ├── create/             # バッチ作成画面
│       ├── input/              # チェック表入力画面
│       ├── approval/           # 承認待ち一覧
│       ├── detail/             # チェック表詳細
│       ├── search/             # 履歴検索
│       └── print/              # 印刷プレビュー
├── components/
│   ├── ui/                     # shadcn/ui コンポーネント
│   ├── forms/                  # フォーム関連コンポーネント
│   └── layout/                 # レイアウトコンポーネント
├── lib/
│   ├── supabase/               # Supabaseクライアント
│   ├── auth.ts                 # 認証ユーティリティ
│   ├── validation.ts           # バリデーション
│   └── utils.ts                # 汎用ユーティリティ
└── types/
    ├── database.ts             # DB型定義
    ├── api.ts                  # API型定義
    └── index.ts                # エクスポート
```

## データベーステーブル

| テーブル名 | 説明 |
|-----------|------|
| users | ユーザーマスタ（employee/manager権限） |
| products | 製品マスタ |
| lines | 製造ラインマスタ |
| templates | チェック表テンプレート（JSONBでセクション定義） |
| records | チェック表データ |
| record_items | 入力値データ |
| operation_logs | 操作ログ |

## ステータス遷移

```
draft (入力中) → submitted (承認待ち) → approved (承認済)
                                      ↘ rejected (差戻し) → submitted
```

## デザイン方針

- プライマリカラー: #059669（エメラルドグリーン）
- 背景: #F8FAFC
- 最小タップターゲット: 48px
- iPad（タブレット）最適化
- 清潔感・安全・信頼のイメージ

## GASからの追加機能

1. **QRコードログイン** - 社員証をスキャンしてログイン（パスワード不要）
2. **PWA対応** - ホーム画面に追加、オフライン対応
3. **モダンUI** - 300万円クラスの競合に見劣りしないデザイン

## 仕様書

詳細仕様は `docs/gas-system-spec.md` を参照

## 特記事項

- FSSC22000認証工場向けシステム
- タブレット入力前提のUI設計
- 自動保存機能あり
- 印刷機能（紙チェック表の再現）

---

## 親CLAUDE.md参照

開発基準・トリガーワード・問題解決は `00_Smalltech/CLAUDE.md` を参照
