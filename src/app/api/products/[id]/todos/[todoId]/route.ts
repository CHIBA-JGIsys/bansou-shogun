/**
 * Product Todo Detail API Routes
 * GET /api/products/[id]/todos/[todoId] - TODO詳細取得
 * PUT /api/products/[id]/todos/[todoId] - TODO更新
 * DELETE /api/products/[id]/todos/[todoId] - TODO削除
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const todoUpdateSchema = z.object({
  name: z.string().min(1, "TODO名は必須です").optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});

/**
 * GET /api/products/[id]/todos/[todoId]
 * TODO詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; todoId: string } }
) {
  try {
    const { id: productId, todoId } = params;

    const todo = await prisma.productTodo.findFirst({
      where: {
        id: todoId,
        productId,
      },
    });

    if (!todo) {
      return NextResponse.json(
        { success: false, error: "TODOが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error("TODO取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "TODOの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]/todos/[todoId]
 * TODO更新（完了/未完了切り替え含む）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; todoId: string } }
) {
  try {
    const { id: productId, todoId } = params;
    const body = await request.json();

    // バリデーション
    const validation = todoUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "バリデーションエラー",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // TODOの存在確認
    const existingTodo = await prisma.productTodo.findFirst({
      where: {
        id: todoId,
        productId,
      },
    });

    if (!existingTodo) {
      return NextResponse.json(
        { success: false, error: "TODOが見つかりません" },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: {
      name?: string;
      completed?: boolean;
      completedAt?: Date | null;
      order?: number;
    } = {};

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }

    if (validation.data.completed !== undefined) {
      updateData.completed = validation.data.completed;
      updateData.completedAt = validation.data.completed ? new Date() : null;
    }

    if (validation.data.order !== undefined) {
      updateData.order = validation.data.order;
    }

    // TODO更新
    const todo = await prisma.productTodo.update({
      where: { id: todoId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: todo,
    });
  } catch (error) {
    console.error("TODO更新エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "TODOの更新に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]/todos/[todoId]
 * TODO削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; todoId: string } }
) {
  try {
    const { id: productId, todoId } = params;

    // TODOの存在確認
    const existingTodo = await prisma.productTodo.findFirst({
      where: {
        id: todoId,
        productId,
      },
    });

    if (!existingTodo) {
      return NextResponse.json(
        { success: false, error: "TODOが見つかりません" },
        { status: 404 }
      );
    }

    // TODO削除
    await prisma.productTodo.delete({
      where: { id: todoId },
    });

    return NextResponse.json({
      success: true,
      message: "TODOを削除しました",
    });
  } catch (error) {
    console.error("TODO削除エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "TODOの削除に失敗しました",
      },
      { status: 500 }
    );
  }
}
