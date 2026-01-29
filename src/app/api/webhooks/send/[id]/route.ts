import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WebhookEntity, WebhookButtonLocation } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/webhooks/send/[id]
 * 送信Webhookの詳細を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const webhook = await prisma.webhookSend.findUnique({
    where: { id },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  return NextResponse.json(webhook)
}

/**
 * PUT /api/webhooks/send/[id]
 * 送信Webhookを更新（管理者のみ）
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
  const body = await request.json()
  const {
    name,
    buttonName,
    url,
    entity,
    fields,
    includeParent,
    buttonLocation,
    isActive,
  } = body

  // 存在確認
  const existing = await prisma.webhookSend.findUnique({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // バリデーション
  if (entity) {
    const validEntities: WebhookEntity[] = ['CUSTOMER', 'DEAL', 'PRODUCT', 'TASK']
    if (!validEntities.includes(entity)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }
  }

  if (buttonLocation) {
    const validLocations: WebhookButtonLocation[] = ['DETAIL', 'LIST']
    if (!validLocations.includes(buttonLocation)) {
      return NextResponse.json(
        { error: 'Invalid button location' },
        { status: 400 }
      )
    }
  }

  if (url) {
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
  }

  const webhook = await prisma.webhookSend.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(buttonName !== undefined && { buttonName }),
      ...(url !== undefined && { url }),
      ...(entity !== undefined && { entity }),
      ...(fields !== undefined && { fields }),
      ...(includeParent !== undefined && { includeParent }),
      ...(buttonLocation !== undefined && { buttonLocation }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json(webhook)
}

/**
 * DELETE /api/webhooks/send/[id]
 * 送信Webhookを削除（管理者のみ）
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

  // 存在確認
  const existing = await prisma.webhookSend.findUnique({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  await prisma.webhookSend.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Webhook deleted successfully' })
}
