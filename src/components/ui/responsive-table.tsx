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
