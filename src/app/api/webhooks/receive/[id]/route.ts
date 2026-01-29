import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/webhooks/receive/[id]
 * 受信Webhookの詳細を取得
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const webhook = await prisma.webhookReceive.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { receivedAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  return NextResponse.json(webhook)
}

/**
 * PUT /api/webhooks/receive/[id]
 * 受信Webhookを更新（管理者のみ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, workflow, isActive } = body

  const existing = await prisma.webhookReceive.findUnique({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  const webhook = await prisma.webhookReceive.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(workflow !== undefined && { workflow }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json(webhook)
}

/**
 * DELETE /api/webhooks/receive/[id]
 * 受信Webhookを削除（管理者のみ）
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.webhookReceive.findUnique({
    where: { id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // 関連するログも削除される（Prismaのカスケード削除）
  await prisma.webhookReceive.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
