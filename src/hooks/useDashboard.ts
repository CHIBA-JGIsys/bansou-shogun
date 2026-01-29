"use client";

import { useQuery } from "@tanstack/react-query";

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

interface KPIResponse {
  success: boolean;
  data?: KPIData;
  error?: string;
}

async function fetchKPI(): Promise<KPIResponse> {
  const res = await fetch("/api/dashboard/kpi");
  return res.json();
}

export function useDashboardKPI() {
  return useQuery({
    queryKey: ["dashboard", "kpi"],
    queryFn: fetchKPI,
    staleTime: 60 * 1000, // 1分間キャッシュ
    gcTime: 5 * 60 * 1000, // 5分間保持
  });
}
