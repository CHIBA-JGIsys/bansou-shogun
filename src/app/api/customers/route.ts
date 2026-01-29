/**
 * Customer API Routes
 * GET /api/customers - 顧客一覧（フィルター、ページネーション対応）
 * POST /api/customers - 顧客作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService, generateClientNo, buildSearchCondition } from "@/lib/crud";
import { customerCreateSchema } from "@/lib/validation";
import type { Customer } from "@prisma/client";
import type { ApiResponse, ListQueryParams } from "@/types/api";

const customerService = new CrudService<Customer>(prisma, "customer");

/**
 * GET /api/customers
 * 顧客一覧取得
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
  const searchCondition = buildSearchCondition(params.search, [
    "name",
    "nameKana",
    "contactPerson",
    "email",
    "clientNo",
  ]);

  // フィルター条件
  const industry = searchParams.get("industry");
  const scale = searchParams.get("scale");
  const mainSalesRepId = searchParams.get("mainSalesRepId");

  const where: Record<string, unknown> = {
    ...searchCondition,
    ...(industry && { industry }),
    ...(scale && { scale }),
    ...(mainSalesRepId && { mainSalesRepId }),
  };

  const result = await customerService.findMany(params, {
    where,
    select: {
      id: true,
      clientNo: true,
      name: true,
      nameKana: true,
      customerTypes: true,
      contactPerson: true,
      email: true,
      industry: true,
      scale: true,
      createdAt: true,
      mainSalesRep: {
        select: { id: true, name: true, email: true },
      },
      subRep: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { deals: true },
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
 * POST /api/customers
 * 顧客作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = customerCreateSchema.safeParse(body);
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

    // クライアント番号の自動採番
    const clientNo = await generateClientNo(prisma);

    // 顧客作成
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await customerService.create(
      {
        ...validation.data,
        clientNo,
      } as unknown as Parameters<typeof customerService.create>[0],
      {
        include: {
          mainSalesRep: {
            select: { id: true, name: true, email: true },
          },
          subRep: {
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
