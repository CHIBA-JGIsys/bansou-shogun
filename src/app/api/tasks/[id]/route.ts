/**
 * Task API Routes (Single Resource)
 * GET /api/tasks/[id] - タスク詳細
 * PUT /api/tasks/[id] - タスク更新
 * DELETE /api/tasks/[id] - タスク削除（論理削除）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService } from "@/lib/crud";
import { taskUpdateSchema } from "@/lib/validation";
import type { Task } from "@prisma/client";
import type { ApiResponse } from "@/types/api";

const taskService = new CrudService<Task>(prisma, "task");

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/tasks/[id]
 * タスク詳細取得
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await taskService.findById(id, {
    include: {
      assignee: {
        select: { id: true, name: true, email: true, role: true },
      },
      creator: {
        select: { id: true, name: true, email: true, role: true },
      },
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
      product: {
        select: {
          id: true,
          name: true,
          productType: true,
          progress: true,
        },
      },
    },
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PUT /api/tasks/[id]
 * タスク更新
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // バリデーション
    const validation = taskUpdateSchema.safeParse(body);
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

    // ステータスが完了に変更された場合、completedAtを設定
    const updateData = { ...validation.data };
    if (updateData.status === "COMPLETED" && !updateData.completedAt) {
      updateData.completedAt = new Date();
    }

    // 更新
    const result = await taskService.update(
      id,
      updateData as unknown as Parameters<typeof taskService.update>[1],
      {
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          deal: {
            select: { id: true, name: true },
          },
          product: {
            select: { id: true, name: true },
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
 * DELETE /api/tasks/[id]
 * タスク削除（論理削除）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const result = await taskService.softDelete(id);

  return NextResponse.json(result, {
    status: result.success ? 200 : 404,
  });
}

/**
 * PATCH /api/tasks/[id]
 * 部分更新（ステータス変更など）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // ステータス変更の場合
    if (body.status && Object.keys(body).length === 1) {
      const updateData: Record<string, unknown> = { status: body.status };
      if (body.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }

      const result = await taskService.update(
        id,
        updateData as unknown as Parameters<typeof taskService.update>[1]
      );
      return NextResponse.json(result, {
        status: result.success ? 200 : 404,
      });
    }

    // カスタムフィールドのみの更新の場合
    if (body.customFields && Object.keys(body).length === 1) {
      const result = await taskService.updateCustomFields(id, body.customFields);
      return NextResponse.json(result, {
        status: result.success ? 200 : 404,
      });
    }

    // 通常の部分更新
    const validation = taskUpdateSchema.safeParse(body);
    if (!validation.success) {
      const response: ApiResponse<null> = {
        success: false,
        error: "バリデーションエラー",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const result = await taskService.update(
      id,
      validation.data as unknown as Parameters<typeof taskService.update>[1]
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
