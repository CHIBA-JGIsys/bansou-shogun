'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface ForecastData {
  month: string
  confirmedSales: number
  expectedSales: number
  targetSales: number
}

interface SalesForecastChartProps {
  data: ForecastData[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-md">
        <p className="mb-2 font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function SalesForecastChart({ data }: SalesForecastChartProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        3ヶ月売上予測
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-sm text-muted-foreground"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('ja-JP', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
              className="text-sm text-muted-foreground"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="confirmedSales"
              name="確定売上"
              fill="#22C55E"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expectedSales"
              name="見込売上"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="targetSales"
              name="目標売上"
              fill="#9CA3AF"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
