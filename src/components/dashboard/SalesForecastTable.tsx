'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ForecastTableData {
  month: string
  confirmedSales: number
  expectedSales: number
  totalForecast: number
  targetSales: number
  achievementRate: number
  status: 'good' | 'warning' | 'danger'
}

interface SalesForecastTableProps {
  data: ForecastTableData[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

const getStatusBadge = (status: 'good' | 'warning' | 'danger') => {
  const styles = {
    good: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }

  const labels = {
    good: '順調',
    warning: '注意',
    danger: '要対策',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  )
}

const calculateStatus = (rate: number): 'good' | 'warning' | 'danger' => {
  if (rate >= 80) return 'good'
  if (rate >= 50) return 'warning'
  return 'danger'
}

export function SalesForecastTable({ data }: SalesForecastTableProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-foreground">売上予測詳細</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>月</TableHead>
            <TableHead className="text-right">確定売上</TableHead>
            <TableHead className="text-right">見込売上</TableHead>
            <TableHead className="text-right">合計予測</TableHead>
            <TableHead className="text-right">目標売上</TableHead>
            <TableHead className="text-right">達成率</TableHead>
            <TableHead className="text-center">ステータス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{row.month}</TableCell>
              <TableCell className="text-right text-green-600 dark:text-green-400">
                {formatCurrency(row.confirmedSales)}
              </TableCell>
              <TableCell className="text-right text-blue-600 dark:text-blue-400">
                {formatCurrency(row.expectedSales)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(row.totalForecast)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(row.targetSales)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.achievementRate.toFixed(1)}%
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(row.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { calculateStatus }
