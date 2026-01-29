/**
 * Deal API Routes
 * GET /api/deals - 案件一覧（フィルター、ページネーション対応）
 * POST /api/deals - 案件作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService, buildSearchCondition } from "@/lib/crud";
import { dealCreateSchema } from "@/lib/validation";
import type { Deal } from "@prisma/client";
import type { ApiResponse, ListQueryParams } from "@/types/api";

const dealService = new CrudService<Deal>(prisma, "deal");

/**
 * GET /api/deals
 * 案件一覧取得
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: ListQueryParams = {
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
    search: searchParams.get("search") || undefined,
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };

  // 検索条件
  const searchCondition = buildSearchCondition(params.search, ["name"]);

  // フィルター条件
  const progress = searchParams.get("progress");
  const salesRepId = searchParams.get("salesRepId");
  const customerId = searchParams.get("customerId");

  const where: Record<string, unknown> = {
    ...searchCondition,
    ...(progress && { progress }),
    ...(salesRepId && { salesRepId }),
    ...(customerId && { customerId }),
  };

  const result = await dealService.findMany(params, {
    where,
    select: {
      id: true,
      name: true,
      dealType: true,
      progress: true,
      isImportant: true,
      occurredDate: true,
      lastContactDate: true,
      createdAt: true,
      customer: {
        select: { id: true, name: true, clientNo: true },
      },
      salesRep: {
        select: { id: true, name: true, email: true },
      },
      officeRep: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { products: true, tasks: true },
      },
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

/**
 * POST /api/deals
 * 案件作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = dealCreateSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }

      const response: ApiResponse<null> = {
        success: false,
        error: "バリデーションエラー",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 案件作成
    const result = await dealService.create(
      validation.data as unknown as Parameters<typeof dealService.create>[0],
      {
        include: {
          customer: {
            select: { id: true, name: true, clientNo: true },
          },
          salesRep: {
            select: { id: true, name: true, email: true },
          },
          officeRep: {
            select: { id: true, name: true, email: true },
          },
        },
      }
    );

    return NextResponse.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "リクエストの処理に失敗しました",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
