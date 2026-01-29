'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/KPICard';
import { Loader2Icon } from 'lucide-react';

interface KPIData {
  recurringRevenue: {
    current: number;
    previous: number;
    trend: number;
  };
  stockRatio: {
    stockRevenue: number;
    totalRevenue: number;
    ratio: number;
  };
  monthlyAchievement: {
    confirmedRevenue: number;
    targetRevenue: number;
    achievementRate: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIData() {
      try {
        const response = await fetch('/api/dashboard/kpi');
        const result = await response.json();

        if (result.success) {
          setKpiData(result.data);
        } else {
          setError(result.error || 'KPIデータの取得に失敗しました');
        }
      } catch (err) {
        setError('KPIデータの取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKPIData();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">ダッシュボード</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          顧客管理システムへようこそ
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      ) : kpiData ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 継続収入 */}
          <KPICard
            title="継続収入"
            value={formatCurrency(kpiData.recurringRevenue.current)}
            subtitle="ストック商材の月額合計"
            icon="recurring"
            trend={{
              value: kpiData.recurringRevenue.trend,
              isPositive: kpiData.recurringRevenue.trend >= 0,
            }}
          />

          {/* ストック比率 */}
          <KPICard
            title="ストック比率"
            value={`${kpiData.stockRatio.ratio.toFixed(1)}%`}
            subtitle={`ストック ${formatCurrency(kpiData.stockRatio.stockRevenue)} / 全体 ${formatCurrency(kpiData.stockRatio.totalRevenue)}`}
            icon="ratio"
          />

          {/* 月間達成率 */}
          <KPICard
            title="月間達成率"
            value={formatCurrency(kpiData.monthlyAchievement.confirmedRevenue)}
            subtitle={`目標: ${formatCurrency(kpiData.monthlyAchievement.targetRevenue)}`}
            icon="target"
            progress={kpiData.monthlyAchievement.achievementRate}
          />
        </div>
      ) : null}
    </div>
  );
}
