import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface WorkflowAction {
  type: 'find' | 'update' | 'create'
  entity: 'CUSTOMER' | 'DEAL' | 'PRODUCT' | 'TASK'
  searchField?: string
  searchKey?: string
  recordIdKey?: string
  mapping?: Record<string, string>
}

interface Workflow {
  actions: WorkflowAction[]
}

/**
 * POST /api/functions/receiveWebhook
 * 外部サービスからのWebhookを受信
 * 認証なし（公開エンドポイント）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_id, ...data } = body

    if (!webhook_id) {
      return NextResponse.json(
        { error: 'webhook_id is required' },
        { status: 400 }
      )
    }

    // Webhook設定を取得
    const webhook = await prisma.webhookReceive.findUnique({
      where: { webhookId: webhook_id },
    })

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { error: 'Webhook is disabled' },
        { status: 403 }
      )
    }

    // ログを保存
    await prisma.webhookLog.create({
      data: {
        webhookReceiveId: webhook.id,
        receivedData: body,
      },
    })

    // ワークフローを実行
    const workflow = webhook.workflow as Workflow | null
    const results: Record<string, unknown>[] = []

    if (workflow?.actions && Array.isArray(workflow.actions)) {
      for (const action of workflow.actions) {
        const result = await executeAction(action, data, results)
        results.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function executeAction(
  action: WorkflowAction,
  data: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _previousResults: Record<string, unknown>[]
): Promise<Record<string, unknown>> {
  const modelMap = {
    CUSTOMER: prisma.customer,
    DEAL: prisma.deal,
    PRODUCT: prisma.product,
    TASK: prisma.task,
  } as const

  const model = modelMap[action.entity]
  if (!model) {
    return { error: `Invalid entity: ${action.entity}` }
  }

  switch (action.type) {
    case 'find': {
      if (!action.searchField || !action.searchKey) {
        return { error: 'searchField and searchKey are required for find action' }
      }

      const searchValue = data[action.searchKey]
      if (searchValue === undefined) {
        return { error: `Key ${action.searchKey} not found in request data` }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record = await (model as any).findFirst({
        where: { [action.searchField]: searchValue },
      })

      return { action: 'find', found: !!record, record }
    }

    case 'update': {
      if (!action.recordIdKey || !action.mapping) {
        return { error: 'recordIdKey and mapping are required for update action' }
      }

      const recordId = data[action.recordIdKey] as string
      if (!recordId) {
        return { error: `Key ${action.recordIdKey} not found in request data` }
      }

      const updateData: Record<string, unknown> = {}
      for (const [sourceKey, targetField] of Object.entries(action.mapping)) {
        if (data[sourceKey] !== undefined) {
          updateData[targetField] = data[sourceKey]
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const record = await (model as any).update({
          where: { id: recordId },
          data: updateData,
        })
        return { action: 'update', success: true, record }
      } catch {
        return { action: 'update', success: false, error: 'Record not found or update failed' }
      }
    }

    case 'create': {
      if (!action.mapping) {
        return { error: 'mapping is required for create action' }
      }

      const createData: Record<string, unknown> = {}
      for (const [sourceKey, targetField] of Object.entries(action.mapping)) {
        if (data[sourceKey] !== undefined) {
          createData[targetField] = data[sourceKey]
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const record = await (model as any).create({
          data: createData,
        })
        return { action: 'create', success: true, record }
      } catch {
        return { action: 'create', success: false, error: 'Create failed' }
      }
    }

    default:
      return { error: `Unknown action type: ${action.type}` }
  }
}
