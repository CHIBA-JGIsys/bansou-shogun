/**
 * API Response Types
 * 共通のAPIレスポンス形式を定義
 */

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

/**
 * カスタムフィールドの値を格納する型
 */
export type CustomFieldValues = Record<string, unknown>;

/**
 * フィールド定義の型（動的バリデーション用）
 */
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "multiselect"
  | "email"
  | "url"
  | "phone";

export type FieldDefinition = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // select, multiselect用
  min?: number; // number用
  max?: number; // number用
  minLength?: number; // text用
  maxLength?: number; // text用
  pattern?: string; // 正規表現パターン
};

/**
 * エンティティ共通の基本フィールド
 */
export type BaseEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  customFields?: CustomFieldValues;
};
