import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/webhooks/receive/[id]/logs
 * 受信Webhookのログ一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const webhook = await prisma.webhookReceive.findUnique({
    where: { id },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where: { webhookReceiveId: id },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.webhookLog.count({
      where: { webhookReceiveId: id },
    }),
  ])

  return NextResponse.json({
    logs,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + logs.length < total,
    },
  })
}
