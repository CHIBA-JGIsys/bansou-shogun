/**
 * Todo Template API Routes
 * GET /api/todo-templates - テンプレート一覧取得
 * POST /api/todo-templates - テンプレート作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateCreateSchema = z.object({
  name: z.string().min(1, "テンプレート名は必須です"),
  description: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "TODO名は必須です"),
        order: z.number().int().optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/todo-templates
 * テンプレート一覧取得
 */
export async function GET() {
  try {
    const templates = await prisma.todoTemplate.findMany({
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("テンプレート取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレート一覧の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todo-templates
 * テンプレート作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = templateCreateSchema.safeParse(body);
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

    const { name, description, items } = validation.data;

    // テンプレート作成（アイテムも一緒に作成）
    const template = await prisma.todoTemplate.create({
      data: {
        name,
        description,
        items: items
          ? {
              create: items.map((item, index) => ({
                name: item.name,
                order: item.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    console.error("テンプレート作成エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレートの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}
