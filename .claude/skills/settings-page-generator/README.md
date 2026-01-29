# Settings Page Generator

設定画面の新規ページを自動生成する Claude Code スキル。

## 概要

CRM アプリケーションの設定画面（`/settings/*`）に新しいページを追加する際に使用するスキル。既存の設定画面パターン（2カラムレイアウト、縦型タブナビ）を踏襲した一貫性のあるページを生成する。

## インストール

このスキルは crm-app プロジェクトの `.claude/skills/` ディレクトリに配置済み。

```
crm-app/.claude/skills/settings-page-generator/
├── SKILL.md              # スキル定義（Claude が読み込む）
├── README.md             # このファイル
└── templates/
    └── page.tsx.template # ページテンプレート
```

## 使用方法

### 基本的な使い方

```bash
# テーブル形式のページを生成
/settings-page-generator notifications

# カード形式のページを生成
/settings-page-generator integrations --type card
```

### 引数

| 引数 | 説明 | デフォルト |
|------|------|------------|
| page-name | ページのスラッグ（URL用） | 必須 |
| --type | コンテンツタイプ（table/card） | table |

## 生成されるファイル

### 1. ページファイル

```
src/app/(dashboard)/settings/{page-name}/page.tsx
```

### 2. 更新されるファイル

```
src/components/settings/SettingsTabs.tsx
```

## ファイル構成

生成後のディレクトリ構造:

```
src/app/(dashboard)/settings/
├── layout.tsx          # 共通レイアウト（既存）
├── page.tsx            # リダイレクト（既存）
├── users/page.tsx      # 既存
├── targets/page.tsx    # 既存
├── templates/page.tsx  # 既存
├── automation/page.tsx # 既存
├── fields/page.tsx     # 既存
└── {new-page}/
    └── page.tsx        # 新規生成
```

## コンテンツタイプ

### テーブル形式（table）

データを行形式で表示。検索機能付き。

- 用途: ユーザー一覧、フィールド一覧など
- 特徴: 検索ボックス、ソート可能なヘッダー、操作メニュー

### カード形式（card）

データをカードとして表示。

- 用途: 目標管理、テンプレート一覧など
- 特徴: グリッドレイアウト、プログレスバー対応、ホバーエフェクト

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UIライブラリ**: shadcn/ui
- **スタイル**: Tailwind CSS
- **アイコン**: lucide-react

## 注意事項

1. **'use client' ディレクティブ**: すべてのページは CSR で動作
2. **モックデータ**: 初期生成時はモックデータを使用、API 接続は別途実装
3. **SettingsTabs 更新**: 新規タブの追加を忘れずに
4. **アイコン選択**: lucide-react から適切なアイコンを選択

## 既存ページの参考

| ページ | タイプ | 特徴 |
|--------|--------|------|
| users | table | 検索、ロールバッジ、統計表示 |
| targets | card | プログレスバー、達成率表示 |
| templates | card | シンプルなカード一覧 |
| automation | tabs | 内部タブ切り替え |
| fields | table | モーダル編集、API連携済み |

## ライセンス

プロジェクト内部使用。
