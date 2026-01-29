import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FieldType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/fields/[id]
 * 特定のフィールド定義を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const field = await prisma.fieldDefinition.findUnique({
    where: { id },
  })

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 })
  }

  return NextResponse.json(field)
}

/**
 * PUT /api/fields/[id]
 * フィールド定義を更新（管理者のみ）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const field = await prisma.fieldDefinition.findUnique({
    where: { id },
  })

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 })
  }

  const body = await request.json()
  const { fieldLabel, fieldType, isRequired, options, order } = body

  // FieldTypeのバリデーション
  if (fieldType) {
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
  }

  // セレクト系に変更する場合、optionsが必要
  const newFieldType = fieldType || field.fieldType
  if ((newFieldType === 'SELECT' || newFieldType === 'MULTI_SELECT') && options !== undefined) {
    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json(
        { error: 'Options are required for SELECT/MULTI_SELECT fields' },
        { status: 400 }
      )
    }
  }

  const updatedField = await prisma.fieldDefinition.update({
    where: { id },
    data: {
      ...(fieldLabel !== undefined && { fieldLabel }),
      ...(fieldType !== undefined && { fieldType }),
      ...(isRequired !== undefined && { isRequired }),
      ...(options !== undefined && { options }),
      ...(order !== undefined && { order }),
    },
  })

  return NextResponse.json(updatedField)
}

/**
 * DELETE /api/fields/[id]
 * フィールド定義を削除（管理者のみ、システムフィールドは削除不可）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const field = await prisma.fieldDefinition.findUnique({
    where: { id },
  })

  if (!field) {
    return NextResponse.json({ error: 'Field not found' }, { status: 404 })
  }

  // システムフィールドは削除不可
  if (field.isSystem) {
    return NextResponse.json(
      { error: 'System fields cannot be deleted' },
      { status: 400 }
    )
  }

  await prisma.fieldDefinition.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
