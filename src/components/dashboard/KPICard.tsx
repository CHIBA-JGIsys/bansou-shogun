'use client';

import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, PercentIcon, TargetIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: 'recurring' | 'ratio' | 'target';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
}

const iconMap = {
  recurring: TrendingUpIcon,
  ratio: PercentIcon,
  target: TargetIcon,
};

const iconColorMap = {
  recurring: 'text-blue-600 bg-blue-100',
  ratio: 'text-purple-600 bg-purple-100',
  target: 'text-green-600 bg-green-100',
};

export function KPICard({ title, value, subtitle, icon, trend, progress }: KPICardProps) {
  const Icon = iconMap[icon];
  const iconColor = iconColorMap[icon];

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`rounded-full p-2 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>

        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}

        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend.isPositive ? (
              <ArrowUpIcon className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">前月比</span>
          </div>
        )}

        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">達成率</span>
              <span className="font-medium">{progress.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${
                  progress >= 100 ? 'bg-green-500' : progress >= 80 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
