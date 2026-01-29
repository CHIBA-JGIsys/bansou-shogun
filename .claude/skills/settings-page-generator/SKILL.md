---
name: settings-page-generator
description: |
  設定画面の新規ページを生成する。
  縦型タブナビ + コンテンツエリアの2カラムレイアウトを自動生成。
  shadcn/ui + Tailwind CSS ベース。
argument-hint: [page-name] [--type table|card]
---

# Settings Page Generator

設定画面（/settings/*）に新規ページを追加するスキル。

## 使い方

```
/settings-page-generator notifications --type card
/settings-page-generator integrations --type table
```

## 引数

| 引数 | 説明 | 必須 |
|------|------|------|
| `$0` | ページ名（slug形式、例: notifications） | Yes |
| `--type` | コンテンツタイプ（table または card） | No（default: table） |

## 生成されるファイル

```
src/app/(dashboard)/settings/{page-name}/
└── page.tsx
```

## 実装手順

### 1. ページファイルを生成

`templates/page.tsx.template` を参考に、以下を含むページを作成:

- `'use client'` ディレクティブ
- lucide-react からアイコンをインポート
- ヘッダー（タイトル + 説明 + 追加ボタン）
- コンテンツ（table または card 形式）
- 空状態（border-dashed スタイル）

### 2. SettingsTabs.tsx を更新

`src/components/settings/SettingsTabs.tsx` の `settingsTabs` 配列に新規タブを追加:

```typescript
{
  label: "{日本語ラベル}",
  href: "/settings/{page-name}",
  icon: {IconComponent},
  description: "{説明文}",
},
```

## パラメータの確認

ページ生成時に以下を確認:

| パラメータ | 説明 | 例 |
|-----------|------|-----|
| pageSlug | URLスラッグ | `notifications` |
| pageTitle | 日本語タイトル | `通知設定` |
| pageDescription | 説明文 | `通知の設定を管理します` |
| icon | lucide-react アイコン | `Bell` |
| addButtonLabel | 追加ボタンテキスト | `通知を追加` |
| contentType | table または card | `table` |

## テンプレート参照

詳細なコードテンプレートは `templates/page.tsx.template` を参照。

## 既存ページの参考

| ページ | タイプ | 参照ファイル |
|--------|--------|-------------|
| users | table | `settings/users/page.tsx` |
| targets | card | `settings/targets/page.tsx` |
| fields | table + modal | `settings/fields/page.tsx` |
| automation | tabs | `settings/automation/page.tsx` |

## スタイルガイド

### 共通クラス

```
ヘッダー: text-xl font-semibold
説明文: text-sm text-muted-foreground
ボタン: inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90
コンテナ: space-y-6
```

### テーブル形式

```
テーブル: w-full, rounded-md border
ヘッダー行: border-b bg-muted/50
セル: px-4 py-3
行ホバー: hover:bg-muted/30
```

### カード形式

```
グリッド: grid gap-4
カード: rounded-lg border p-4 hover:border-primary/50 transition-colors
アイコン背景: flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10
```

### 空状態

```
コンテナ: rounded-lg border border-dashed p-8 text-center
アイコン: mx-auto h-10 w-10 text-muted-foreground/50
テキスト: mt-2 text-sm text-muted-foreground
```
