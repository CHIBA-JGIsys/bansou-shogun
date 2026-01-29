/**
 * Product Todo from Template API Routes
 * POST /api/products/[id]/todos/from-template - テンプレートからTODO一括作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fromTemplateSchema = z.object({
  templateId: z.string().min(1, "テンプレートIDは必須です"),
});

/**
 * POST /api/products/[id]/todos/from-template
 * テンプレートからTODO一括作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = params;
    const body = await request.json();

    // バリデーション
    const validation = fromTemplateSchema.safeParse(body);
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

    const { templateId } = validation.data;

    // トランザクション内で全ての処理を実行
    const result = await prisma.$transaction(async (tx) => {
      // 商材の存在確認
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("NOT_FOUND:商材が見つかりません");
      }

      // テンプレートとアイテムの取得
      const template = await tx.todoTemplate.findUnique({
        where: { id: templateId },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        throw new Error("NOT_FOUND:テンプレートが見つかりません");
      }

      if (template.items.length === 0) {
        throw new Error("BAD_REQUEST:テンプレートにTODOアイテムがありません");
      }

      // 現在の最大order取得
      const maxOrder = await tx.productTodo.aggregate({
        _max: { order: true },
        where: { productId },
      });

      const startOrder = (maxOrder._max.order ?? -1) + 1;

      // TODO一括作成
      await tx.productTodo.createMany({
        data: template.items.map((item, index) => ({
          name: item.name,
          order: startOrder + index,
          productId,
          completed: false,
        })),
      });

      // 作成したTODOを取得して返す
      const createdTodos = await tx.productTodo.findMany({
        where: { productId },
        orderBy: { order: "asc" },
      });

      return {
        todos: createdTodos,
        itemCount: template.items.length,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: result.todos,
        message: `${result.itemCount}件のTODOを追加しました`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("テンプレートからTODO作成エラー:", error);

    // トランザクション内で投げたエラーを適切に処理
    if (error instanceof Error) {
      if (error.message.startsWith("NOT_FOUND:")) {
        return NextResponse.json(
          { success: false, error: error.message.replace("NOT_FOUND:", "") },
          { status: 404 }
        );
      }
      if (error.message.startsWith("BAD_REQUEST:")) {
        return NextResponse.json(
          { success: false, error: error.message.replace("BAD_REQUEST:", "") },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "テンプレートからのTODO作成に失敗しました",
      },
      { status: 500 }
    );
  }
}
