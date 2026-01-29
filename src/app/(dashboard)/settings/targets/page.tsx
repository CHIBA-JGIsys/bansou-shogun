"use client";

import { Target, Plus, TrendingUp, Calendar } from "lucide-react";

// モック目標データ
const mockTargets = [
  { yearMonth: "2024-01", targetAmount: 5000000, actualAmount: 4800000 },
  { yearMonth: "2024-02", targetAmount: 5500000, actualAmount: 5200000 },
  { yearMonth: "2024-03", targetAmount: 6000000, actualAmount: 6500000 },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${parseInt(month)}月`;
}

function getAchievementRate(actual: number, target: number): number {
  return Math.round((actual / target) * 100);
}

export default function TargetsSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">目標管理</h2>
          <p className="text-sm text-muted-foreground">
            月次売上目標を設定・管理します
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          目標を追加
        </button>
      </div>

      {/* Targets List */}
      <div className="grid gap-4">
        {mockTargets.map((target) => {
          const rate = getAchievementRate(target.actualAmount, target.targetAmount);
          const isAchieved = rate >= 100;

          return (
            <div
              key={target.yearMonth}
              className="rounded-lg border p-4 hover:border-primary/50 transition-colors"
            >
              {/* ヘッダー部分 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatYearMonth(target.yearMonth)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      目標: {formatCurrency(target.targetAmount)}
                    </div>
                  </div>
                </div>

                {/* モバイル: 2列グリッド / デスクトップ: 横並び */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-6">
                  <div className="text-left md:text-right">
                    <div className="text-sm text-muted-foreground">実績</div>
                    <div className="font-medium">
                      {formatCurrency(target.actualAmount)}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                        isAchieved
                          ? "bg-green-100 text-green-700"
                          : rate >= 80
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {rate}%
                    </div>
                  </div>

                  <button className="col-span-2 md:col-span-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                    編集
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      isAchieved ? "bg-green-500" : rate >= 80 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State for Future */}
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Target className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          将来の月次目標を追加して、売上計画を立てましょう
        </p>
      </div>
    </div>
  );
}
