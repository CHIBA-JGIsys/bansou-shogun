# page-header-generator

レスポンシブ対応ページヘッダー＋ビュー切替コンポーネント生成スキル

## 概要

一覧画面や詳細画面で使用する共通ヘッダーコンポーネントを生成する。モバイルファーストのレスポンシブ設計で、ページタイトル・説明・アクションボタン・戻るリンクを統一的に配置できる。

## 使用場面

- 一覧画面（顧客一覧、案件一覧、タスク一覧など）
- 詳細画面（戻るリンク付き）
- 一覧/カンバン切り替えが必要な画面

## 前提条件

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui（`cn` ユーティリティ）
- lucide-react（アイコン）

## コンポーネント

### 1. PageHeader

ページ上部のヘッダー。タイトル・説明・アクションボタンを配置。

#### Props

| Prop | 型 | 必須 | 説明 |
|------|-----|------|------|
| title | string | Yes | ページタイトル |
| description | string | No | タイトル下の説明文 |
| actions | ReactNode | No | 右側に配置するアクション（ボタン等） |
| backHref | string | No | 戻るリンクのURL |
| className | string | No | 追加のCSSクラス |

#### レスポンシブ動作

| 画面サイズ | レイアウト |
|-----------|----------|
| モバイル（< 640px） | 縦積み（タイトル上、アクション下） |
| デスクトップ（≥ 640px） | 横並び（タイトル左、アクション右） |

#### コード

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  backHref?: string
  className?: string
}

function PageHeader({
  title,
  description,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Link>
        )}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export { PageHeader }
export type { PageHeaderProps }
```

### 2. ViewToggle

一覧表示とカンバン表示を切り替えるトグルボタン。

#### Props

| Prop | 型 | 必須 | 説明 |
|------|-----|------|------|
| view | "list" \| "kanban" | Yes | 現在の表示モード |
| onViewChange | (view) => void | Yes | 表示モード変更時のコールバック |
| listLabel | string | No | 一覧ボタンのラベル（デフォルト: "一覧"） |
| kanbanLabel | string | No | カンバンボタンのラベル（デフォルト: "カンバン"） |
| className | string | No | 追加のCSSクラス |

#### レスポンシブ動作

| 画面サイズ | 表示 |
|-----------|------|
| モバイル（< 640px） | アイコンのみ |
| デスクトップ（≥ 640px） | アイコン＋テキスト |

#### コード

```tsx
"use client"

import * as React from "react"
import { List, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface ViewToggleProps {
  view: "list" | "kanban"
  onViewChange: (view: "list" | "kanban") => void
  listLabel?: string
  kanbanLabel?: string
  className?: string
}

function ViewToggle({
  view,
  onViewChange,
  listLabel = "一覧",
  kanbanLabel = "カンバン",
  className,
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">{listLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange("kanban")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          view === "kanban"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">{kanbanLabel}</span>
      </button>
    </div>
  )
}

export { ViewToggle }
export type { ViewToggleProps }
```

## 使用例

### 一覧画面（ViewToggle付き）

```tsx
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader, ViewToggle } from '@/components/ui/page-header'

export default function CustomersPage() {
  const [view, setView] = useState<'list' | 'kanban'>('list')

  return (
    <div className="p-6">
      <PageHeader
        title="顧客一覧"
        description="登録されている顧客を管理します"
        actions={
          <>
            <ViewToggle view={view} onViewChange={setView} />
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" />
              新規作成
            </button>
          </>
        }
      />

      {view === 'list' ? (
        <div>{/* テーブル表示 */}</div>
      ) : (
        <div>{/* カンバン表示 */}</div>
      )}
    </div>
  )
}
```

### 詳細画面（戻るリンク付き）

```tsx
import { PageHeader } from '@/components/ui/page-header'

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <PageHeader
        title="株式会社サンプル"
        description="顧客ID: C-001"
        backHref="/customers"
        actions={
          <button className="rounded-md border px-4 py-2 text-sm">
            編集
          </button>
        }
      />

      {/* 詳細コンテンツ */}
    </div>
  )
}
```

### シンプルな一覧画面（アクションなし）

```tsx
import { PageHeader } from '@/components/ui/page-header'

export default function SettingsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="設定"
        description="アプリケーションの設定を管理します"
      />

      {/* 設定コンテンツ */}
    </div>
  )
}
```

## カスタマイズ

### 戻るリンクのテキスト変更

戻るリンクのテキストを変更したい場合は、コンポーネントを拡張するか、`backHref`の代わりにカスタムの戻るリンクを`actions`の前に配置する。

### ViewToggleのカスタムビュー

`list` / `kanban` 以外のビュー（例: `grid`, `calendar`）が必要な場合は、ViewToggleを拡張して対応する。

## ファイル配置

```
src/
└── components/
    └── ui/
        └── page-header.tsx  # PageHeader, ViewToggle を export
```

## 依存関係

```json
{
  "dependencies": {
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```
