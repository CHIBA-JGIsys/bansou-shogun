/**
 * Dashboard KPI API
 * GET /api/dashboard/kpi - ダッシュボードKPIデータ取得
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// キャッシュ設定: 60秒
export const revalidate = 60;

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

interface KPIRawResult {
  current_stock: number | null;
  previous_stock: number | null;
  total_stock: number | null;
  total_spot: number | null;
  month_stock: number | null;
  month_spot: number | null;
  target_amount: number | null;
}

/**
 * GET /api/dashboard/kpi
 * KPIデータ取得（最適化版 - 単一クエリ）
 */
export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 今月の開始日と終了日
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // 先月の終了日
    const previousMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 今月の目標売上用のyearMonth
    const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // 単一のRaw SQLクエリで全KPIを取得
    const result = await prisma.$queryRaw<KPIRawResult[]>`
      WITH current_stock AS (
        SELECT COALESCE(SUM("monthlyAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'STOCK'
          AND "orderDate" IS NOT NULL
          AND "recordingStartDate" <= ${currentMonthEnd}
          AND "deletedAt" IS NULL
      ),
      previous_stock AS (
        SELECT COALESCE(SUM("monthlyAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'STOCK'
          AND "orderDate" IS NOT NULL
          AND "recordingStartDate" <= ${previousMonthEnd}
          AND "deletedAt" IS NULL
      ),
      total_stock AS (
        SELECT COALESCE(SUM("monthlyAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'STOCK'
          AND "orderDate" IS NOT NULL
          AND "deletedAt" IS NULL
      ),
      total_spot AS (
        SELECT COALESCE(SUM("confirmedAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'SPOT'
          AND "orderDate" IS NOT NULL
          AND "deletedAt" IS NULL
      ),
      month_stock AS (
        SELECT COALESCE(SUM("monthlyAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'STOCK'
          AND "orderDate" >= ${currentMonthStart}
          AND "orderDate" <= ${currentMonthEnd}
          AND "deletedAt" IS NULL
      ),
      month_spot AS (
        SELECT COALESCE(SUM("confirmedAmount"), 0) as amount
        FROM "Product"
        WHERE "productType" = 'SPOT'
          AND "orderDate" >= ${currentMonthStart}
          AND "orderDate" <= ${currentMonthEnd}
          AND "deletedAt" IS NULL
      ),
      target AS (
        SELECT "targetAmount" as amount
        FROM "MonthlyTarget"
        WHERE "yearMonth" = ${yearMonth}
      )
      SELECT
        (SELECT amount FROM current_stock) as current_stock,
        (SELECT amount FROM previous_stock) as previous_stock,
        (SELECT amount FROM total_stock) as total_stock,
        (SELECT amount FROM total_spot) as total_spot,
        (SELECT amount FROM month_stock) as month_stock,
        (SELECT amount FROM month_spot) as month_spot,
        (SELECT amount FROM target) as target_amount
    `;

    const row = result[0] || {
      current_stock: 0,
      previous_stock: 0,
      total_stock: 0,
      total_spot: 0,
      month_stock: 0,
      month_spot: 0,
      target_amount: 0,
    };

    // 継続収入の計算
    const currentRecurringRevenue = Number(row.current_stock) || 0;
    const previousRecurringRevenue = Number(row.previous_stock) || 0;
    const recurringTrend = previousRecurringRevenue > 0
      ? ((currentRecurringRevenue - previousRecurringRevenue) / previousRecurringRevenue) * 100
      : currentRecurringRevenue > 0 ? 100 : 0;

    // ストック比率の計算
    const stockRevenue = Number(row.total_stock) || 0;
    const spotRevenue = Number(row.total_spot) || 0;
    const totalRevenue = stockRevenue + spotRevenue;
    const stockRatio = totalRevenue > 0 ? (stockRevenue / totalRevenue) * 100 : 0;

    // 月間達成率の計算
    const currentMonthStockRevenue = Number(row.month_stock) || 0;
    const currentMonthSpotRevenue = Number(row.month_spot) || 0;
    const currentMonthRevenue = currentMonthStockRevenue + currentMonthSpotRevenue;
    const targetRevenue = Number(row.target_amount) || 0;
    const achievementRate = targetRevenue > 0
      ? (currentMonthRevenue / targetRevenue) * 100
      : 0;

    const kpiData: KPIData = {
      recurringRevenue: {
        current: currentRecurringRevenue,
        previous: previousRecurringRevenue,
        trend: recurringTrend,
      },
      stockRatio: {
        stockRevenue,
        totalRevenue,
        ratio: stockRatio,
      },
      monthlyAchievement: {
        confirmedRevenue: currentMonthRevenue,
        targetRevenue,
        achievementRate,
      },
    };

    return NextResponse.json({
      success: true,
      data: kpiData,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('KPI取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'KPIデータの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
