import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WebhookEntity, WebhookButtonLocation } from '@prisma/client'

/**
 * GET /api/webhooks/send
 * 送信Webhook一覧を取得
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhooks = await prisma.webhookSend.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(webhooks)
}

/**
 * POST /api/webhooks/send
 * 新しい送信Webhookを作成（管理者のみ）
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

  // バリデーション
  if (!name || !buttonName || !url || !entity) {
    return NextResponse.json(
      { error: 'name, buttonName, url, entity are required' },
      { status: 400 }
    )
  }

  // EntityTypeのバリデーション
  const validEntities: WebhookEntity[] = ['CUSTOMER', 'DEAL', 'PRODUCT', 'TASK']
  if (!validEntities.includes(entity)) {
    return NextResponse.json(
      { error: 'Invalid entity type' },
      { status: 400 }
    )
  }

  // ButtonLocationのバリデーション
  const validLocations: WebhookButtonLocation[] = ['DETAIL', 'LIST']
  if (buttonLocation && !validLocations.includes(buttonLocation)) {
    return NextResponse.json(
      { error: 'Invalid button location' },
      { status: 400 }
    )
  }

  // URLのバリデーション
  try {
    new URL(url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  const webhook = await prisma.webhookSend.create({
    data: {
      name,
      buttonName,
      url,
      entity,
      fields: fields || [],
      includeParent: includeParent ?? false,
      buttonLocation: buttonLocation || 'DETAIL',
      isActive: isActive ?? true,
    },
  })

  return NextResponse.json(webhook, { status: 201 })
}
