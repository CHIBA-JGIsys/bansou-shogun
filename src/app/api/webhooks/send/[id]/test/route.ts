import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/webhooks/send/[id]/test
 * Webhookのテスト送信を実行（管理者のみ）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { recordId } = body

  if (!recordId) {
    return NextResponse.json(
      { error: 'recordId is required for test' },
      { status: 400 }
    )
  }

  // Webhook設定を取得
  const webhook = await prisma.webhookSend.findUnique({
    where: { id },
  })

  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }

  // レコードを取得
  let record: Record<string, unknown> | null = null
  let parentData: Record<string, unknown> = {}

  try {
    switch (webhook.entity) {
      case 'CUSTOMER':
        record = await prisma.customer.findUnique({
          where: { id: recordId },
        })
        break
      case 'DEAL':
        record = await prisma.deal.findUnique({
          where: { id: recordId },
          include: webhook.includeParent ? { customer: true } : undefined,
        }) as Record<string, unknown> | null
        if (record && webhook.includeParent && record.customer) {
          parentData = prefixKeys(record.customer as Record<string, unknown>, '顧客_')
          delete record.customer
        }
        break
      case 'PRODUCT':
        record = await prisma.product.findUnique({
          where: { id: recordId },
          include: webhook.includeParent ? { deal: { include: { customer: true } } } : undefined,
        }) as Record<string, unknown> | null
        if (record && webhook.includeParent) {
          if (record.deal) {
            const deal = record.deal as Record<string, unknown>
            parentData = { ...prefixKeys(deal, '案件_') }
            if (deal.customer) {
              parentData = { ...parentData, ...prefixKeys(deal.customer as Record<string, unknown>, '顧客_') }
            }
            delete record.deal
          }
        }
        break
      case 'TASK':
        record = await prisma.task.findUnique({
          where: { id: recordId },
          include: webhook.includeParent ? {
            deal: { include: { customer: true } },
            product: { include: { deal: { include: { customer: true } } } },
          } : undefined,
        }) as Record<string, unknown> | null
        if (record && webhook.includeParent) {
          if (record.deal) {
            const deal = record.deal as Record<string, unknown>
            parentData = { ...prefixKeys(deal, '案件_') }
            if (deal.customer) {
              parentData = { ...parentData, ...prefixKeys(deal.customer as Record<string, unknown>, '顧客_') }
            }
            delete record.deal
          }
          if (record.product) {
            const product = record.product as Record<string, unknown>
            parentData = { ...parentData, ...prefixKeys(product, '商材_') }
            if (product.deal) {
              const deal = product.deal as Record<string, unknown>
              parentData = { ...parentData, ...prefixKeys(deal, '案件_') }
              if (deal.customer) {
                parentData = { ...parentData, ...prefixKeys(deal.customer as Record<string, unknown>, '顧客_') }
              }
            }
            delete record.product
          }
        }
        break
    }
  } catch (error) {
    console.error('Error fetching record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    )
  }

  if (!record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  // 送信データを構築
  const selectedFields = webhook.fields as string[]
  const payload: Record<string, unknown> = {
    recordId,
    entityType: webhook.entity,
  }

  // 選択されたフィールドのみ追加
  if (selectedFields.length > 0) {
    for (const field of selectedFields) {
      if (field in record) {
        payload[field] = record[field]
      }
      // 親データからも探す
      if (field in parentData) {
        payload[field] = parentData[field]
      }
    }
  } else {
    // フィールドが指定されていない場合は全フィールド送信
    Object.assign(payload, record, parentData)
  }

  // Webhookを送信
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      payload,
      response: responseText.substring(0, 1000), // 最初の1000文字まで
    })
  } catch (error) {
    console.error('Webhook send error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      payload,
    })
  }
}

/**
 * オブジェクトのキーにプレフィックスを追加
 */
function prefixKeys(obj: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    // ネストしたオブジェクトやIDなどは除外
    if (typeof value !== 'object' || value === null || value instanceof Date) {
      result[`${prefix}${key}`] = value
    }
  }
  return result
}
