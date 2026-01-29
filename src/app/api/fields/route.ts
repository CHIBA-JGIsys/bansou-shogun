import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EntityType, FieldType } from '@prisma/client'

/**
 * GET /api/fields
 * フィールド定義一覧を取得
 * クエリパラメータ: entity (CUSTOMER | DEAL | PRODUCT | TASK)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const entityParam = searchParams.get('entity')

  const where = entityParam
    ? { entityType: entityParam as EntityType }
    : {}

  const fields = await prisma.fieldDefinition.findMany({
    where,
    orderBy: [
      { entityType: 'asc' },
      { order: 'asc' },
    ],
  })

  return NextResponse.json(fields)
}

/**
 * POST /api/fields
 * 新しいフィールド定義を作成（管理者のみ）
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { entityType, fieldName, fieldLabel, fieldType, isRequired, options, order } = body

  // バリデーション
  if (!entityType || !fieldName || !fieldLabel || !fieldType) {
    return NextResponse.json(
      { error: 'entityType, fieldName, fieldLabel, fieldType are required' },
      { status: 400 }
    )
  }

  // EntityTypeのバリデーション
  if (!['CUSTOMER', 'DEAL', 'PRODUCT', 'TASK'].includes(entityType)) {
    return NextResponse.json(
      { error: 'Invalid entityType' },
      { status: 400 }
    )
  }

  // FieldTypeのバリデーション
  const validFieldTypes: FieldType[] = [
    'TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT',
    'RELATION', 'CHECKBOX', 'URL', 'EMAIL'
  ]
  if (!validFieldTypes.includes(fieldType)) {
    return NextResponse.json(
      { error: 'Invalid fieldType' },
      { status: 400 }
    )
  }

  // セレクト系の場合、optionsが必要
  if ((fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') && (!options || !Array.isArray(options) || options.length === 0)) {
    return NextResponse.json(
      { error: 'Options are required for SELECT/MULTI_SELECT fields' },
      { status: 400 }
    )
  }

  // fieldNameの重複チェック
  const existing = await prisma.fieldDefinition.findFirst({
    where: { entityType, fieldName },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Field with this name already exists for this entity' },
      { status: 409 }
    )
  }

  // 最大orderを取得
  const maxOrderField = await prisma.fieldDefinition.findFirst({
    where: { entityType },
    orderBy: { order: 'desc' },
  })
  const nextOrder = order ?? (maxOrderField ? maxOrderField.order + 1 : 0)

  const field = await prisma.fieldDefinition.create({
    data: {
      entityType,
      fieldName,
      fieldLabel,
      fieldType,
      isRequired: isRequired ?? false,
      options: options ?? null,
      order: nextOrder,
      isSystem: false,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
