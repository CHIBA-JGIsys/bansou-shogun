/**
 * Trash API Routes
 * GET /api/trash - 削除済みデータ一覧（エンティティタイプ別）
 * POST /api/trash/restore - 復元
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api";

type EntityType = "customer" | "deal" | "product" | "task";

/**
 * GET /api/trash?type=customer|deal|product|task
 * 削除済みデータ一覧取得
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("type") as EntityType;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!entityType || !["customer", "deal", "product", "task"].includes(entityType)) {
    return NextResponse.json(
      { success: false, error: "Invalid entity type" },
      { status: 400 }
    );
  }

  const skip = (page - 1) * limit;

  try {
    let data: unknown[];
    let total: number;

    switch (entityType) {
      case "customer":
        [data, total] = await Promise.all([
          prisma.customer.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              clientNo: true,
              name: true,
              nameKana: true,
              deletedAt: true,
              createdAt: true,
            },
          }),
          prisma.customer.count({ where: { deletedAt: { not: null } } }),
        ]);
        break;

      case "deal":
        [data, total] = await Promise.all([
          prisma.deal.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              progress: true,
              deletedAt: true,
              createdAt: true,
              customer: {
                select: { id: true, name: true, clientNo: true },
              },
            },
          }),
          prisma.deal.count({ where: { deletedAt: { not: null } } }),
        ]);
        break;

      case "product":
        [data, total] = await Promise.all([
          prisma.product.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              productType: true,
              progress: true,
              deletedAt: true,
              createdAt: true,
              deal: {
                select: {
                  id: true,
                  name: true,
                  customer: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          }),
          prisma.product.count({ where: { deletedAt: { not: null } } }),
        ]);
        break;

      case "task":
        [data, total] = await Promise.all([
          prisma.task.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              name: true,
              status: true,
              taskType: true,
              deletedAt: true,
              createdAt: true,
              deal: {
                select: { id: true, name: true },
              },
              product: {
                select: { id: true, name: true },
              },
            },
          }),
          prisma.task.count({ where: { deletedAt: { not: null } } }),
        ]);
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "データの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trash
 * 復元処理
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, id } = body as { entityType: EntityType; id: string };

    if (!entityType || !id) {
      return NextResponse.json(
        { success: false, error: "entityType and id are required" },
        { status: 400 }
      );
    }

    if (!["customer", "deal", "product", "task"].includes(entityType)) {
      return NextResponse.json(
        { success: false, error: "Invalid entity type" },
        { status: 400 }
      );
    }

    let restored: unknown;

    switch (entityType) {
      case "customer":
        restored = await prisma.customer.update({
          where: { id },
          data: { deletedAt: null },
        });
        break;
      case "deal":
        restored = await prisma.deal.update({
          where: { id },
          data: { deletedAt: null },
        });
        break;
      case "product":
        restored = await prisma.product.update({
          where: { id },
          data: { deletedAt: null },
        });
        break;
      case "task":
        restored = await prisma.task.update({
          where: { id },
          data: { deletedAt: null },
        });
        break;
    }

    const response: ApiResponse<unknown> = {
      success: true,
      data: restored,
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "復元に失敗しました",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trash
 * 完全削除処理
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, id } = body as { entityType: EntityType; id: string };

    if (!entityType || !id) {
      return NextResponse.json(
        { success: false, error: "entityType and id are required" },
        { status: 400 }
      );
    }

    if (!["customer", "deal", "product", "task"].includes(entityType)) {
      return NextResponse.json(
        { success: false, error: "Invalid entity type" },
        { status: 400 }
      );
    }

    switch (entityType) {
      case "customer":
        await prisma.customer.delete({ where: { id } });
        break;
      case "deal":
        await prisma.deal.delete({ where: { id } });
        break;
      case "product":
        await prisma.product.delete({ where: { id } });
        break;
      case "task":
        await prisma.task.delete({ where: { id } });
        break;
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "削除に失敗しました",
      },
      { status: 500 }
    );
  }
}
