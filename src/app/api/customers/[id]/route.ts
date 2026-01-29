/**
 * Customer API Routes (Single Resource)
 * GET /api/customers/[id] - 顧客詳細
 * PUT /api/customers/[id] - 顧客更新
 * DELETE /api/customers/[id] - 顧客削除（論理削除）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService } from "@/lib/crud";
import { customerUpdateSchema } from "@/lib/validation";
import type { Customer } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

const customerService = new CrudService<Customer>(prisma, "customer");

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/customers/[id]
 * 顧客詳細取得
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await customerService.findById(id, {
    include: {
      mainSalesRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      subRep: {
        select: { id: true, name: true, email: true, role: true },
      },
      referrer: {
        select: { id: true, name: true, clientNo: true },
      },
      referrals: {
        select: { id: true, name: true, clientNo: true },
        where: { deletedAt: null },
      },
      deals: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          dealType: true,
          progress: true,
          isImportant: true,
          createdAt: true,
          _count: {
            select: { products: true, tasks: true },
          },
        },
      },
      _count: {
        select: {
          deals: { where: { deletedAt: null } },
          referrals: { where: { deletedAt: null } },
        },
      },
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PUT /api/customers/[id]
 * 顧客更新
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // バリデーション
    const validation = customerUpdateSchema.safeParse(body);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await customerService.update(id, validation.data as unknown as Parameters<typeof customerService.update>[1], {
      include: {
        mainSalesRep: {
          select: { id: true, name: true, email: true },
        },
        subRep: {
          select: { id: true, name: true, email: true },
        },
      },
    });

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
 * DELETE /api/customers/[id]
 * 顧客削除（論理削除）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await customerService.softDelete(id);

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PATCH /api/customers/[id]
 * 部分更新（カスタムフィールドのみ更新など）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // カスタムフィールドのみの更新の場合
    if (body.customFields && Object.keys(body).length === 1) {
      const result = await customerService.updateCustomFields(id, body.customFields);
      return NextResponse.json(result, {
        status: result.success ? 200 : 404,
      });
    }

    // 通常の部分更新
    const validation = customerUpdateSchema.safeParse(body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: "バリデーションエラー",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await customerService.update(id, validation.data as unknown as Parameters<typeof customerService.update>[1]);

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
