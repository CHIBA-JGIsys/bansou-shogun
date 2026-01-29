/**
 * Product API Routes
 * GET /api/products - 商材一覧（フィルター、ページネーション対応）
 * POST /api/products - 商材作成
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CrudService, buildSearchCondition } from "@/lib/crud";
import { productCreateSchema } from "@/lib/validation";
import type { Product } from "@prisma/client";
import type { ApiResponse, ListQueryParams } from "@/types/api";

const productService = new CrudService<Product>(prisma, "product");

/**
 * GET /api/products
 * 商材一覧取得
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

  // 検索条件（商材名）
  const searchCondition = buildSearchCondition(params.search, ["name"]);

  // フィルター条件
  const productType = searchParams.get("productType");
  const progress = searchParams.get("progress");
  const dealId = searchParams.get("dealId");
  const probability = searchParams.get("probability");

  const where: Record<string, unknown> = {
    ...searchCondition,
    ...(productType && { productType }),
    ...(progress && { progress }),
    ...(dealId && { dealId }),
    ...(probability && { probability }),
  };

  const result = await productService.findMany(params, {
    where,
    select: {
      id: true,
      name: true,
      productType: true,
      progress: true,
      probability: true,
      expectedAmount: true,
      confirmedAmount: true,
      monthlyAmount: true,
      orderDate: true,
      createdAt: true,
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
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

/**
 * POST /api/products
 * 商材作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, ...productData } = body;

    // バリデーション
    const validation = productCreateSchema.safeParse(productData);
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

    // 案件の存在確認
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

    // テンプレートがある場合は取得
    let templateItems: { name: string; order: number }[] = [];
    if (templateId) {
      const template = await prisma.todoTemplate.findUnique({
        where: { id: templateId },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      });
      if (template) {
        templateItems = template.items.map((item) => ({
          name: item.name,
          order: item.order,
        }));
      }
    }

    // トランザクションで商材とTODOを作成
    const product = await prisma.$transaction(async (tx) => {
      // 商材作成
      const newProduct = await tx.product.create({
        data: validation.data as Parameters<typeof tx.product.create>[0]["data"],
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
          todos: true,
        },
      });

      // テンプレートからTODOを作成
      if (templateItems.length > 0) {
        await tx.productTodo.createMany({
          data: templateItems.map((item) => ({
            name: item.name,
            order: item.order,
            productId: newProduct.id,
          })),
        });

        // TODOを含めて再取得
        return tx.product.findUnique({
          where: { id: newProduct.id },
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
            todos: {
              orderBy: { order: "asc" },
            },
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : "リクエストの処理に失敗しました",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
