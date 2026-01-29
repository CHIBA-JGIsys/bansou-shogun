/**
 * Todo Template Detail API Routes
 * GET /api/todo-templates/[id] - テンプレート詳細取得
 * PUT /api/todo-templates/[id] - テンプレート更新
 * DELETE /api/todo-templates/[id] - テンプレート削除
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateUpdateSchema = z.object({
  name: z.string().min(1, "テンプレート名は必須です").optional(),
  description: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().optional(), // 既存アイテムの場合
        name: z.string().min(1, "TODO名は必須です"),
        order: z.number().int().optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/todo-templates/[id]
 * テンプレート詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const template = await prisma.todoTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("テンプレート取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレートの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/todo-templates/[id]
 * テンプレート更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // バリデーション
    const validation = templateUpdateSchema.safeParse(body);
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

    // 存在確認
    const existing = await prisma.todoTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    const { name, description, items } = validation.data;

    // トランザクションで更新
    const template = await prisma.$transaction(async (tx) => {
      // テンプレート本体の更新
      await tx.todoTemplate.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
        },
      });

      // アイテムの更新（指定されている場合）
      if (items !== undefined) {
        // 既存アイテムを削除
        await tx.todoItem.deleteMany({
          where: { templateId: id },
        });

        // 新しいアイテムを作成
        if (items.length > 0) {
          await tx.todoItem.createMany({
            data: items.map((item, index) => ({
              name: item.name,
              order: item.order ?? index,
              templateId: id,
            })),
          });
        }
      }

      // 更新後のテンプレートを取得
      return tx.todoTemplate.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("テンプレート更新エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレートの更新に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todo-templates/[id]
 * テンプレート削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 存在確認
    const existing = await prisma.todoTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "テンプレートが見つかりません" },
        { status: 404 }
      );
    }

    // 削除（onDelete: Cascadeでアイテムも削除される）
    await prisma.todoTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "テンプレートを削除しました",
    });
  } catch (error) {
    console.error("テンプレート削除エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレートの削除に失敗しました",
      },
      { status: 500 }
    );
  }
}
