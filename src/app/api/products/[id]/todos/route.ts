/**
 * Product Todo API Routes
 * GET /api/products/[id]/todos - TODO一覧取得
 * POST /api/products/[id]/todos - TODO追加
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const todoCreateSchema = z.object({
  name: z.string().min(1, "TODO名は必須です"),
  order: z.number().int().optional(),
});

/**
 * GET /api/products/[id]/todos
 * TODO一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params;

    // 商材の存在確認
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "商材が見つかりません" },
        { status: 404 }
      );
    }

    const todos = await prisma.productTodo.findMany({
      where: { productId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: todos,
    });
  } catch (error) {
    console.error("TODO取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "TODO一覧の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/todos
 * TODO追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params;
    const body = await request.json();

    // バリデーション
    const validation = todoCreateSchema.safeParse(body);
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

    // 商材の存在確認
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "商材が見つかりません" },
        { status: 404 }
      );
    }

    // 最大order取得
    const maxOrder = await prisma.productTodo.aggregate({
      _max: { order: true },
      where: { productId },
    });

    const newOrder = validation.data.order ?? (maxOrder._max.order ?? -1) + 1;

    // TODO作成
    const todo = await prisma.productTodo.create({
      data: {
        name: validation.data.name,
        order: newOrder,
        productId,
      },
    });

    return NextResponse.json(
      { success: true, data: todo },
      { status: 201 }
    );
  } catch (error) {
    console.error("TODO作成エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "TODOの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}
