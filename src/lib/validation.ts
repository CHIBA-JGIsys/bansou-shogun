/**
 * Dynamic Validation Utilities
 * FieldDefinitionに基づいた動的バリデーション
 */

import { z, ZodTypeAny } from "zod";
import type { FieldDefinition } from "@/types/api";

/**
 * フィールドタイプに応じたZodスキーマを生成
 */
function createFieldSchema(field: FieldDefinition): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (field.type) {
    case "text":
      schema = z.string();
      if (field.minLength !== undefined) {
        schema = (schema as z.ZodString).min(
          field.minLength,
          `${field.name}は${field.minLength}文字以上で入力してください`
        );
      }
      if (field.maxLength !== undefined) {
        schema = (schema as z.ZodString).max(
          field.maxLength,
          `${field.name}は${field.maxLength}文字以下で入力してください`
        );
      }
      if (field.pattern) {
        schema = (schema as z.ZodString).regex(
          new RegExp(field.pattern),
          `${field.name}の形式が正しくありません`
        );
      }
      break;

    case "number":
      schema = z.number();
      if (field.min !== undefined) {
        schema = (schema as z.ZodNumber).min(
          field.min,
          `${field.name}は${field.min}以上で入力してください`
        );
      }
      if (field.max !== undefined) {
        schema = (schema as z.ZodNumber).max(
          field.max,
          `${field.name}は${field.max}以下で入力してください`
        );
      }
      break;

    case "date":
      schema = z.coerce.date();
      break;

    case "boolean":
      schema = z.boolean();
      break;

    case "select":
      if (field.options && field.options.length > 0) {
        schema = z.enum(field.options as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;

    case "multiselect":
      if (field.options && field.options.length > 0) {
        schema = z.array(z.enum(field.options as [string, ...string[]]));
      } else {
        schema = z.array(z.string());
      }
      break;

    case "email":
      schema = z.string().email(`${field.name}は有効なメールアドレスを入力してください`);
      break;

    case "url":
      schema = z.string().url(`${field.name}は有効なURLを入力してください`);
      break;

    case "phone":
      schema = z
        .string()
        .regex(/^[\d\-+().\s]+$/, `${field.name}は有効な電話番号を入力してください`);
      break;

    default:
      schema = z.unknown();
  }

  // 必須でない場合はoptionalにする
  if (!field.required) {
    schema = schema.optional().nullable();
  }

  return schema;
}

/**
 * FieldDefinition配列からZodスキーマを動的生成
 */
export function createDynamicSchema(fields: FieldDefinition[]) {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    shape[field.id] = createFieldSchema(field);
  }

  return z.object(shape);
}

/**
 * カスタムフィールドの値をバリデーション
 */
export function validateCustomFields(
  values: Record<string, unknown>,
  fields: FieldDefinition[]
): { success: boolean; errors?: Record<string, string[]> } {
  const schema = createDynamicSchema(fields);
  const result = schema.safeParse(values);

  if (result.success) {
    return { success: true };
  }

  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return { success: false, errors };
}

/**
 * 顧客作成用のZodスキーマ
 */
export const customerCreateSchema = z.object({
  name: z.string().min(1, "クライアント名は必須です"),
  nameKana: z.string().optional().nullable(),
  customerTypes: z.array(z.enum(["CLIENT", "REFERRER"])).min(1, "顧客タイプを1つ以上選択してください"),
  contactPerson: z.string().optional().nullable(),
  contactPersonPhone: z.string().optional().nullable(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().nullable(),
  postalCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url("有効なURLを入力してください").optional().nullable(),
  industry: z.enum(["IT", "MANUFACTURING", "RETAIL", "SERVICE", "OTHER"]).optional().nullable(),
  scale: z.enum(["LARGE", "MEDIUM", "SMALL", "INDIVIDUAL"]).optional().nullable(),
  employeeCount: z.number().int().positive().optional().nullable(),
  mainContactTool: z
    .enum(["EMAIL", "PHONE", "CHATWORK", "SLACK", "LINE", "ZOOM"])
    .optional()
    .nullable(),
  subContactTool: z
    .enum(["EMAIL", "PHONE", "CHATWORK", "SLACK", "LINE", "ZOOM"])
    .optional()
    .nullable(),
  chatworkUrl: z.string().optional().nullable(),
  slackChannel: z.string().optional().nullable(),
  googleDriveUrl: z.string().optional().nullable(),
  consultingContract: z.boolean().optional(),
  referralFeePercent: z.number().optional().nullable(),
  referralFee: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  mainSalesRepId: z.string().optional().nullable(),
  subRepId: z.string().optional().nullable(),
  referrerId: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * 顧客更新用のZodスキーマ（全フィールドオプショナル）
 */
export const customerUpdateSchema = customerCreateSchema.partial();

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

/**
 * 商材作成用のZodスキーマ
 */
export const productCreateSchema = z.object({
  name: z.string().min(1, "商材名は必須です"),
  dealId: z.string().min(1, "案件は必須です"),
  productType: z.enum(["SPOT", "STOCK"], { message: "商材種別は必須です" }),
  progress: z.enum(["NEGOTIATION", "PROPOSAL", "VERBAL_AGREEMENT", "CONTRACT"]).optional(),
  probability: z.enum(["A", "B", "C", "D"]).optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  orderDate: z.coerce.date().optional().nullable(),
  deliveryDate: z.coerce.date().optional().nullable(),
  recordingDate: z.coerce.date().optional().nullable(),
  recordingStartDate: z.coerce.date().optional().nullable(),
  expectedAmount: z.number().optional().nullable(),
  confirmedAmount: z.number().optional().nullable(),
  monthlyAmount: z.number().optional().nullable(),
  grossProfit: z.number().optional().nullable(),
  referralFee: z.number().optional().nullable(),
  salesRepId: z.string().optional().nullable(),
  officeRepId: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * 商材更新用のZodスキーマ（全フィールドオプショナル）
 */
export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/**
 * 案件作成用のZodスキーマ
 */
export const dealCreateSchema = z.object({
  name: z.string().min(1, "案件名は必須です"),
  customerId: z.string().min(1, "顧客は必須です"),
  dealType: z.enum(["NEW", "EXISTING", "REFERRAL"]).optional().nullable(),
  progress: z.enum(["LEAD", "FIRST_MEETING", "WAITING_DETAILS", "DETAILS_OBTAINED"]).optional(),
  occurredDate: z.coerce.date().optional().nullable(),
  lastContactDate: z.coerce.date().optional().nullable(),
  isImportant: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  salesRepId: z.string().optional().nullable(),
  officeRepId: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * 案件更新用のZodスキーマ（全フィールドオプショナル）
 */
export const dealUpdateSchema = dealCreateSchema.partial();

export type DealCreateInput = z.infer<typeof dealCreateSchema>;
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;

/**
 * タスク作成用のZodスキーマ
 */
export const taskCreateSchema = z.object({
  name: z.string().min(1, "タスク名は必須です"),
  detail: z.string().optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  taskType: z.enum(["ESTIMATE", "CONTRACT", "INVOICE", "DELIVERY", "OTHER"]).optional().nullable(),
  binding: z.enum(["DEAL", "PRODUCT", "STANDALONE"]).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  fileUrl: z.string().url("有効なURLを入力してください").optional().nullable(),
  dealId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  creatorId: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * タスク更新用のZodスキーマ（全フィールドオプショナル）
 */
export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
