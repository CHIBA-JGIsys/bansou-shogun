import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function generateWebhookId(): string {
  return `wh_${crypto.randomBytes(8).toString('hex')}`
}

/**
 * GET /api/webhooks/receive
 * 受信Webhook一覧を取得
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhooks = await prisma.webhookReceive.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { logs: true }
      }
    }
  })

  return NextResponse.json(webhooks)
}

/**
 * POST /api/webhooks/receive
 * 新しい受信Webhookを作成（管理者のみ）
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
  const { name, workflow, isActive } = body

  if (!name) {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    )
  }

  // Webhook IDを自動生成
  const webhookId = generateWebhookId()

  const webhook = await prisma.webhookReceive.create({
    data: {
      name,
      webhookId,
      workflow: workflow ?? {},
      isActive: isActive ?? true,
    },
  })

  return NextResponse.json(webhook, { status: 201 })
}
