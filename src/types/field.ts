import type { EntityType, FieldType } from '@prisma/client'

/**
 * フィールド定義の型
 */
export interface FieldDefinition {
  id: string
  entityType: EntityType
  fieldName: string
  fieldLabel: string
  fieldType: FieldType
  isRequired: boolean
  options: SelectOption[] | null
  order: number
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * セレクト系フィールドの選択肢
 */
export interface SelectOption {
  value: string
  label: string
  color?: string
}

/**
 * フィールド作成用DTO
 */
export interface CreateFieldDto {
  entityType: EntityType
  fieldName: string
  fieldLabel: string
  fieldType: FieldType
  isRequired?: boolean
  options?: SelectOption[]
  order?: number
}

/**
 * フィールド更新用DTO
 */
export interface UpdateFieldDto {
  fieldLabel?: string
  fieldType?: FieldType
  isRequired?: boolean
  options?: SelectOption[]
  order?: number
}

/**
 * フィールドタイプの表示名マッピング
 */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: 'テキスト',
  NUMBER: '数値',
  DATE: '日付',
  SELECT: '単一選択',
  MULTI_SELECT: '複数選択',
  RELATION: 'リレーション',
  CHECKBOX: 'チェックボックス',
  URL: 'URL',
  EMAIL: 'メールアドレス',
}

/**
 * エンティティタイプの表示名マッピング
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  CUSTOMER: '顧客',
  DEAL: '案件',
  PRODUCT: '商材',
  TASK: 'タスク',
}

/**
 * フィールドタイプがセレクト系かどうか
 */
export function isSelectFieldType(type: FieldType): boolean {
  return type === 'SELECT' || type === 'MULTI_SELECT'
}
