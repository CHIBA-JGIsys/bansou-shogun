/**
 * Task API Routes
 * GET /api/tasks - タスク一覧（フィルター、ページネーション対応）
 * POST /api/tasks - タスク作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService, buildSearchCondition } from "@/lib/crud";
import { taskCreateSchema } from "@/lib/validation";
import type { Task } from "@prisma/client";
import type { ApiResponse, ListQueryParams } from "@/types/api";

const taskService = new CrudService<Task>(prisma, "task");

/**
 * GET /api/tasks
 * タスク一覧取得
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
  const searchCondition = buildSearchCondition(params.search, ["name", "detail"]);

  // フィルター条件
  const status = searchParams.get("status");
  const taskType = searchParams.get("taskType");
  const assigneeId = searchParams.get("assigneeId");
  const dealId = searchParams.get("dealId");
  const productId = searchParams.get("productId");
  const dueDateFrom = searchParams.get("dueDateFrom");
  const dueDateTo = searchParams.get("dueDateTo");

  const where: Record<string, unknown> = {
    ...searchCondition,
    ...(status && { status }),
    ...(taskType && { taskType }),
    ...(assigneeId && { assigneeId }),
    ...(dealId && { dealId }),
    ...(productId && { productId }),
  };

  // 期限フィルター
  if (dueDateFrom || dueDateTo) {
    where.dueDate = {
      ...(dueDateFrom && { gte: new Date(dueDateFrom) }),
      ...(dueDateTo && { lte: new Date(dueDateTo) }),
    };
  }

  const result = await taskService.findMany(params, {
    where,
    select: {
      id: true,
      name: true,
      detail: true,
      status: true,
      taskType: true,
      binding: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
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
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

/**
 * POST /api/tasks
 * タスク作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = taskCreateSchema.safeParse(body);
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

    // タスク作成
    const result = await taskService.create(
      validation.data as unknown as Parameters<typeof taskService.create>[0],
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
