# responsive-table-generator

レスポンシブ対応テーブルコンポーネントを生成するスキル。モバイルではカード表示、デスクトップではテーブル表示に自動切替する。

## 概要と使用場面

### 使用場面
- 一覧画面でモバイル対応が必要な場合
- データ一覧をカード/テーブル両方で表示したい場合
- 型安全なテーブルコンポーネントが必要な場合

### 特徴
- **md未満（768px未満）**: カード表示（縦積み）
- **md以上（768px以上）**: テーブル表示（横スクロール対応）
- ジェネリクスで型安全
- カスタムレンダラー対応
- 行クリックイベント対応

## コンポーネントコード

```tsx
// src/components/ui/responsive-table.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T
  header: string
  render?: (item: T) => React.ReactNode
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  primaryField: keyof T
  onRowClick?: (item: T) => void
  className?: string
  emptyMessage?: string
}

export function ResponsiveTable<T extends { id: string | number }>({
  data,
  columns,
  primaryField,
  onRowClick,
  className,
  emptyMessage = 'データがありません',
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  const renderCellContent = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item)
    }
    const value = item[column.key]
    if (value === null || value === undefined) {
      return '-'
    }
    return String(value)
  }

  return (
    <div className={cn('w-full', className)}>
      {/* モバイル: カード表示 (md未満) */}
      <div className="block md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border bg-white p-4 shadow-sm',
              onRowClick && 'cursor-pointer hover:border-blue-300 hover:bg-gray-50'
            )}
            onClick={() => onRowClick?.(item)}
          >
            {/* primaryFieldを大きく表示 */}
            <div className="mb-3 font-semibold text-gray-900">
              {renderCellContent(
                item,
                columns.find((c) => c.key === primaryField) || { key: primaryField, header: '' }
              )}
            </div>
            {/* 他フィールドは2列グリッドで表示 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {columns
                .filter((col) => col.key !== primaryField)
                .map((column) => (
                  <div key={String(column.key)}>
                    <div className="text-gray-500">{column.header}</div>
                    <div className="text-gray-900">{renderCellContent(item, column)}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* デスクトップ: テーブル表示 (md以上) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="p-4 align-middle"
                  >
                    {renderCellContent(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

## Props設計

| Prop | 型 | 必須 | 説明 |
|------|------|------|------|
| `data` | `T[]` | ✅ | 表示するデータ配列 |
| `columns` | `Column<T>[]` | ✅ | カラム定義の配列 |
| `primaryField` | `keyof T` | ✅ | モバイルでメインタイトルとして表示するフィールド |
| `onRowClick` | `(item: T) => void` | - | 行クリック時のコールバック |
| `className` | `string` | - | ラッパーに追加するクラス |
| `emptyMessage` | `string` | - | データがない時のメッセージ（デフォルト: "データがありません"） |

### 型制約
データ型 `T` は `{ id: string | number }` を満たす必要がある（一意識別子として使用）。

## columns定義の書き方

### 基本形式

```tsx
interface Column<T> {
  key: keyof T        // データのキー
  header: string      // ヘッダーに表示するラベル
  render?: (item: T) => React.ReactNode  // カスタムレンダラー（オプション）
}
```

### 基本例

```tsx
type Customer = {
  id: string
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

const columns: Column<Customer>[] = [
  { key: 'name', header: '顧客名' },
  { key: 'email', header: 'メールアドレス' },
  { key: 'status', header: 'ステータス' },
  { key: 'createdAt', header: '登録日' },
]
```

## カスタムレンダラーの実装例

### ステータスバッジの表示

```tsx
const columns: Column<Customer>[] = [
  { key: 'name', header: '顧客名' },
  {
    key: 'status',
    header: 'ステータス',
    render: (item) => (
      <span
        className={cn(
          'rounded-full px-2 py-1 text-xs font-medium',
          item.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        )}
      >
        {item.status === 'ACTIVE' ? '有効' : '無効'}
      </span>
    ),
  },
]
```

### 日付のフォーマット

```tsx
{
  key: 'createdAt',
  header: '登録日',
  render: (item) => new Date(item.createdAt).toLocaleDateString('ja-JP'),
}
```

### 金額のフォーマット

```tsx
{
  key: 'amount',
  header: '金額',
  render: (item) =>
    new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(item.amount),
}
```

### 複合表示（アイコン付き）

```tsx
import { Star } from 'lucide-react'

{
  key: 'name',
  header: '案件名',
  render: (item) => (
    <div className="flex items-center gap-2">
      {item.isImportant && <Star className="h-4 w-4 text-yellow-500" />}
      <span>{item.name}</span>
    </div>
  ),
}
```

## 使用例（一覧ページでの呼び出し方）

### 基本的な使用例

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { ResponsiveTable } from '@/components/ui/responsive-table'

type Deal = {
  id: string
  name: string
  customer: string
  progress: string
  amount: number
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])

  const columns = [
    { key: 'name' as const, header: '案件名' },
    { key: 'customer' as const, header: '顧客' },
    {
      key: 'progress' as const,
      header: '進捗',
      render: (item: Deal) => (
        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
          {item.progress}
        </span>
      ),
    },
    {
      key: 'amount' as const,
      header: '金額',
      render: (item: Deal) => `¥${item.amount.toLocaleString()}`,
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">案件一覧</h1>
      <ResponsiveTable
        data={deals}
        columns={columns}
        primaryField="name"
        onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
        emptyMessage="案件がありません"
      />
    </div>
  )
}
```

## スタイリングのカスタマイズ方法

### ラッパーにクラスを追加

```tsx
<ResponsiveTable
  className="border rounded-lg"
  // ...
/>
```

### カードスタイルの変更

コンポーネント内の以下のクラスを変更:

```tsx
// カードのスタイル
'rounded-lg border bg-white p-4 shadow-sm'

// ホバー時のスタイル
'cursor-pointer hover:border-blue-300 hover:bg-gray-50'
```

### テーブルヘッダーのスタイル変更

```tsx
// ヘッダーセル
'h-12 px-4 text-left align-middle font-medium text-muted-foreground'
```

### 行のホバースタイル変更

```tsx
// 行のスタイル
'border-b transition-colors hover:bg-muted/50'
```

## 依存関係

- `@/lib/utils` の `cn` 関数（clsx + tailwind-merge）
- Tailwind CSS

### cn関数が無い場合

```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

インストール:
```bash
npm install clsx tailwind-merge
```
