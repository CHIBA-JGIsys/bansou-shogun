/**
 * Product API Routes (Single Resource)
 * GET /api/products/[id] - 商材詳細
 * PUT /api/products/[id] - 商材更新
 * DELETE /api/products/[id] - 商材削除（論理削除）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService } from "@/lib/crud";
import { productUpdateSchema } from "@/lib/validation";
import type { Product } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

const productService = new CrudService<Product>(prisma, "product");

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/products/[id]
 * 商材詳細取得
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await productService.findById(id, {
    include: {
      deal: {
        select: {
          id: true,
          name: true,
          progress: true,
          customer: {
            select: { id: true, name: true, clientNo: true },
          },
        },
      },
      salesRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      officeRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      todos: {
        orderBy: { order: "asc" },
        where: { completed: false },
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          status: true,
          taskType: true,
          dueDate: true,
          assignee: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PUT /api/products/[id]
 * 商材更新
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // バリデーション
    const validation = productUpdateSchema.safeParse(body);
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

    // 案件が変更された場合、存在確認
    if (validation.data.dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: validation.data.dealId },
      });
      if (!deal) {
        const response: ApiResponse<null> = {
          success: false,
          error: "指定された案件が存在しません",
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // 更新
    const result = await productService.update(
      id,
      validation.data as unknown as Parameters<typeof productService.update>[1],
      {
        include: {
          deal: {
            select: {
              id: true,
              name: true,
              customer: {
                select: { id: true, name: true, clientNo: true },
              },
            },
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
 * DELETE /api/products/[id]
 * 商材削除（論理削除）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await productService.softDelete(id);

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PATCH /api/products/[id]
 * 部分更新（カスタムフィールドのみ更新など）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // カスタムフィールドのみの更新の場合
    if (body.customFields && Object.keys(body).length === 1) {
      const result = await productService.updateCustomFields(id, body.customFields);
      return NextResponse.json(result, {
        status: result.success ? 200 : 404,
      });
    }

    // 通常の部分更新
    const validation = productUpdateSchema.safeParse(body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: "バリデーションエラー",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await productService.update(
      id,
      validation.data as unknown as Parameters<typeof productService.update>[1]
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
