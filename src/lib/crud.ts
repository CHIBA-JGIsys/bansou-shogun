/**
 * Generic CRUD Utilities
 * 動的フィールド対応の汎用CRUD操作基盤
 */

import { PrismaClient, Prisma } from "@prisma/client";
import type {
  ApiResponse,
  ListQueryParams,
  PaginationMeta,
  CustomFieldValues,
} from "@/types/api";

// 基本的なエンティティ構造
type BaseRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  customFields?: Prisma.JsonValue;
};

/**
 * ページネーション付きリスト取得のオプション
 */
type ListOptions<T> = {
  where?: Prisma.Args<T, "findMany">["where"];
  orderBy?: Prisma.Args<T, "findMany">["orderBy"];
  include?: Prisma.Args<T, "findMany">["include"];
  select?: Prisma.Args<T, "findMany">["select"];
};

// Prisma include/select オプションの型
type PrismaQueryOptions = {
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
};

// Prismaモデルデリゲートのキー
type PrismaModelKey = keyof Omit<
  PrismaClient,
  | "$connect"
  | "$disconnect"
  | "$on"
  | "$transaction"
  | "$use"
  | "$extends"
>;

/**
 * 汎用CRUDユーティリティクラス
 */
export class CrudService<T extends BaseRecord> {
  constructor(
    private prisma: PrismaClient,
    private modelName: PrismaModelKey
  ) {}

  /**
   * モデルのPrismaデリゲートを取得
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get model(): any {
    return this.prisma[this.modelName] as unknown;
  }

  /**
   * 一覧取得（ページネーション付き）
   */
  async findMany(
    params: ListQueryParams,
    options?: ListOptions<T>
  ): Promise<ApiResponse<T[]>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = false,
    } = params;

    const skip = (page - 1) * limit;

    // 論理削除フィルター
    const deletedFilter = includeDeleted ? {} : { deletedAt: null };

    // 検索条件の構築
    const where = {
      ...deletedFilter,
      ...options?.where,
    };

    // ソート条件
    const orderBy = options?.orderBy || { [sortBy]: sortOrder };

    try {
      // 並列でデータ取得とカウント
      const [data, total] = await Promise.all([
        this.model.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: options?.include,
          select: options?.select,
        }),
        this.model.count({ where }),
      ]);

      const meta: PaginationMeta = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return {
        success: true,
        data,
        meta,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの取得に失敗しました",
      };
    }
  }

  /**
   * 単一レコード取得
   */
  async findById(
    id: string,
    options?: PrismaQueryOptions
  ): Promise<ApiResponse<T>> {
    try {
      const data = await this.model.findUnique({
        where: { id },
        include: options?.include,
        select: options?.select,
      });

      if (!data) {
        return {
          success: false,
          error: "データが見つかりません",
        };
      }

      // 論理削除されている場合
      if (data.deletedAt) {
        return {
          success: false,
          error: "データは削除されています",
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの取得に失敗しました",
      };
    }
  }

  /**
   * レコード作成
   */
  async create(
    data: Omit<T, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    options?: PrismaQueryOptions
  ): Promise<ApiResponse<T>> {
    try {
      const created = await this.model.create({
        data,
        include: options?.include,
        select: options?.select,
      });

      return {
        success: true,
        data: created,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return {
            success: false,
            error: "一意制約違反: 同じ値が既に存在します",
          };
        }
        if (error.code === "P2003") {
          return {
            success: false,
            error: "外部キー制約違反: 関連するデータが存在しません",
          };
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの作成に失敗しました",
      };
    }
  }

  /**
   * レコード更新
   */
  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
    options?: PrismaQueryOptions
  ): Promise<ApiResponse<T>> {
    try {
      // 存在確認
      const existing = await this.model.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: "データが見つかりません",
        };
      }

      if (existing.deletedAt) {
        return {
          success: false,
          error: "削除されたデータは更新できません",
        };
      }

      const updated = await this.model.update({
        where: { id },
        data,
        include: options?.include,
        select: options?.select,
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return {
            success: false,
            error: "一意制約違反: 同じ値が既に存在します",
          };
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの更新に失敗しました",
      };
    }
  }

  /**
   * 論理削除
   */
  async softDelete(id: string): Promise<ApiResponse<T>> {
    try {
      const existing = await this.model.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: "データが見つかりません",
        };
      }

      if (existing.deletedAt) {
        return {
          success: false,
          error: "データは既に削除されています",
        };
      }

      const deleted = await this.model.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        success: true,
        data: deleted,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの削除に失敗しました",
      };
    }
  }

  /**
   * 論理削除の復元
   */
  async restore(id: string): Promise<ApiResponse<T>> {
    try {
      const existing = await this.model.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: "データが見つかりません",
        };
      }

      if (!existing.deletedAt) {
        return {
          success: false,
          error: "データは削除されていません",
        };
      }

      const restored = await this.model.update({
        where: { id },
        data: { deletedAt: null },
      });

      return {
        success: true,
        data: restored,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの復元に失敗しました",
      };
    }
  }

  /**
   * 物理削除（管理者用）
   */
  async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      await this.model.delete({ where: { id } });
      return {
        success: true,
        data: null,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return {
            success: false,
            error: "データが見つかりません",
          };
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "データの削除に失敗しました",
      };
    }
  }

  /**
   * カスタムフィールドの更新
   */
  async updateCustomFields(
    id: string,
    customFields: CustomFieldValues
  ): Promise<ApiResponse<T>> {
    try {
      const existing = await this.model.findUnique({ where: { id } });
      if (!existing) {
        return {
          success: false,
          error: "データが見つかりません",
        };
      }

      // 既存のカスタムフィールドとマージ
      const existingCustomFields = (existing.customFields as CustomFieldValues) || {};
      const mergedCustomFields = { ...existingCustomFields, ...customFields };

      const updated = await this.model.update({
        where: { id },
        data: { customFields: mergedCustomFields },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "カスタムフィールドの更新に失敗しました",
      };
    }
  }
}

/**
 * 顧客番号の自動採番
 */
export async function generateClientNo(prisma: PrismaClient): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { clientNo: "desc" },
    select: { clientNo: true },
  });

  if (!lastCustomer) {
    return "C-0001";
  }

  const lastNumber = parseInt(lastCustomer.clientNo.replace("C-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `C-${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * 検索条件のヘルパー
 */
export function buildSearchCondition(
  search: string | undefined,
  fields: string[]
): Record<string, unknown> | undefined {
  if (!search) return undefined;

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: "insensitive",
      },
    })),
  };
}
