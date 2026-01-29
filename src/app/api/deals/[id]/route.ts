/**
 * Deal API Routes (Single Resource)
 * GET /api/deals/[id] - 案件詳細
 * PUT /api/deals/[id] - 案件更新
 * DELETE /api/deals/[id] - 案件削除（論理削除）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService } from "@/lib/crud";
import { dealUpdateSchema } from "@/lib/validation";
import type { Deal } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

const dealService = new CrudService<Deal>(prisma, "deal");

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/deals/[id]
 * 案件詳細取得
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await dealService.findById(id, {
    include: {
      customer: {
        select: { id: true, name: true, clientNo: true, email: true },
      },
      salesRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      officeRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      products: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          productType: true,
          progress: true,
          probability: true,
          expectedAmount: true,
          confirmedAmount: true,
          monthlyAmount: true,
          createdAt: true,
          _count: {
            select: { tasks: true },
          },
        },
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          status: true,
          taskType: true,
          dueDate: true,
          completedAt: true,
          assignee: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: {
          products: { where: { deletedAt: null } },
          tasks: { where: { deletedAt: null } },
        },
      },
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PUT /api/deals/[id]
 * 案件更新
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // バリデーション
    const validation = dealUpdateSchema.safeParse(body);
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

    // 更新
    const result = await dealService.update(
      id,
      validation.data as unknown as Parameters<typeof dealService.update>[1],
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
      status: result.success ? 200 : 404,
    });
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "リクエストの処理に失敗しました",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/deals/[id]
 * 案件削除（論理削除）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await dealService.softDelete(id);

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}
