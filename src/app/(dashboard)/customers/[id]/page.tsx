'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pencil,
  Trash2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  FileText,
  Activity,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

interface TaskItem {
  id: string
  name: string
  status: TaskStatus
  taskType: string | null
  dueDate: string | null
  assignee: { id: string; name: string } | null
}

interface ProductItem {
  id: string
  name: string
  tasks: TaskItem[]
}

interface Customer {
  id: string
  clientNo: string
  name: string
  nameKana: string | null
  customerTypes: string[]
  contactPerson: string | null
  contactPersonPhone: string | null
  email: string | null
  postalCode: string | null
  address: string | null
  website: string | null
  industry: string | null
  scale: string | null
  employeeCount: number | null
  mainContactTool: string | null
  subContactTool: string | null
  chatworkUrl: string | null
  slackChannel: string | null
  googleDriveUrl: string | null
  consultingContract: boolean
  referralFeePercent: number | null
  referralFee: number | null
  notes: string | null
  mainSalesRep: { id: string; name: string; email: string } | null
  subRep: { id: string; name: string; email: string } | null
  referrer: { id: string; name: string; clientNo: string } | null
  deals: {
    id: string
    name: string
    dealType: string | null
    progress: string
    isImportant: boolean
    createdAt: string
    tasks: TaskItem[]
    products: ProductItem[]
  }[]
  createdAt: string
  updatedAt: string
}

const customerTypeLabels: Record<string, string> = {
  CLIENT: 'クライアント',
  REFERRER: '紹介者',
}

const industryLabels: Record<string, string> = {
  IT: 'IT',
  MANUFACTURING: '製造',
  RETAIL: '小売',
  SERVICE: 'サービス',
  OTHER: 'その他',
}

const scaleLabels: Record<string, string> = {
  LARGE: '大企業',
  MEDIUM: '中企業',
  SMALL: '小企業',
  INDIVIDUAL: '個人事業主',
}

const contactToolLabels: Record<string, string> = {
  EMAIL: 'メール',
  PHONE: '電話',
  CHATWORK: 'Chatwork',
  SLACK: 'Slack',
  LINE: 'LINE',
  ZOOM: 'Zoom',
}

const dealProgressLabels: Record<string, string> = {
  LEAD: 'リード',
  FIRST_MEETING: '初回面談',
  WAITING_DETAILS: '明細待ち',
  DETAILS_OBTAINED: '明細取得済み',
}

const taskStatusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  TODO: { label: '未着手', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  IN_PROGRESS: { label: '進行中', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  COMPLETED: { label: '完了', color: 'text-green-700', bgColor: 'bg-green-100' },
}

type TabType = 'info' | 'deals' | 'tasks' | 'activity'

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setCustomer(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [id])

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/customers')
      }
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-gray-500">顧客が見つかりません</div>
        <button
          onClick={() => router.push('/customers')}
          className="text-blue-600 hover:underline"
        >
          一覧に戻る
        </button>
      </div>
    )
  }

  // 全タスクを抽出（案件タスク + 商材タスクを統合）
  const dealTasks = customer.deals.flatMap((deal) =>
    (deal.tasks || []).map((task) => ({
      ...task,
      dealId: deal.id,
      dealName: deal.name,
      source: `案件: ${deal.name}`,
    }))
  )
  const productTasks = customer.deals.flatMap((deal) =>
    (deal.products || []).flatMap((product) =>
      (product.tasks || []).map((task) => ({
        ...task,
        dealId: deal.id,
        dealName: deal.name,
        source: `商材: ${product.name}`,
      }))
    )
  )
  const allTasks = [...dealTasks, ...productTasks]

  // タスクステータス更新（楽観的UI）- 案件タスク & 商材タスク両対応
  const updateTaskInCustomer = (
    prev: Customer | null,
    taskId: string,
    newStatus: TaskStatus
  ): Customer | null => {
    if (!prev) return prev
    return {
      ...prev,
      deals: prev.deals.map((deal) => ({
        ...deal,
        tasks: deal.tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ),
        products: (deal.products || []).map((product) => ({
          ...product,
          tasks: product.tasks.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          ),
        })),
      })),
    }
  }

  const handleTaskStatusToggle = async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'

    // 楽観的UI更新
    setCustomer((prev) => updateTaskInCustomer(prev, taskId, newStatus))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // 失敗時はロールバック
        setCustomer((prev) => updateTaskInCustomer(prev, taskId, currentStatus))
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
      // ロールバック
      setCustomer((prev) => updateTaskInCustomer(prev, taskId, currentStatus))
    }
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: '基本情報', icon: <FileText className="h-4 w-4" /> },
    { id: 'deals', label: '案件', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'tasks', label: 'タスク', icon: <CheckSquare className="h-4 w-4" /> },
    { id: 'activity', label: '活動履歴', icon: <Activity className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <PageHeader
        title={customer.name}
        description={`${customer.clientNo}${customer.nameKana ? ` - ${customer.nameKana}` : ''}`}
        backHref="/customers"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push(`/deals/new?customerId=${id}`)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">案件作成</span>
            </button>
            <button
              onClick={() => router.push(`/customers/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">編集</span>
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">削除</span>
            </button>
          </div>
        }
      />

      {/* Customer Types */}
      <div className="flex gap-2">
        {customer.customerTypes.map((type) => (
          <span
            key={type}
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              type === 'CLIENT'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {customerTypeLabels[type] || type}
          </span>
        ))}
        {customer.consultingContract && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            コンサルティング契約
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-2 sm:gap-4 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-3 sm:px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg border bg-white p-4 sm:p-6 shadow-sm">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  基本情報
                </h3>
                <dl className="space-y-3">
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">業種</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.industry
                        ? industryLabels[customer.industry]
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">事業規模</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.scale ? scaleLabels[customer.scale] : '-'}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">従業員数</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.employeeCount
                        ? `${customer.employeeCount}名`
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  連絡先
                </h3>
                <dl className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {customer.email || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {customer.contactPersonPhone || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {customer.website ? (
                      <a
                        href={customer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {customer.website}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-900">-</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {customer.postalCode && `〒${customer.postalCode} `}
                      {customer.address || '-'}
                    </span>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  担当者情報
                </h3>
                <dl className="space-y-3">
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">担当者名</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.contactPerson || '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  社内担当
                </h3>
                <dl className="space-y-3">
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">主担当</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.mainSalesRep?.name || '-'}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">副担当</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.subRep?.name || '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  連絡ツール
                </h3>
                <dl className="space-y-3">
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">メイン</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.mainContactTool
                        ? contactToolLabels[customer.mainContactTool]
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 text-sm text-gray-500">サブ</dt>
                    <dd className="text-sm text-gray-900">
                      {customer.subContactTool
                        ? contactToolLabels[customer.subContactTool]
                        : '-'}
                    </dd>
                  </div>
                </dl>
              </div>

              {customer.referrer && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    紹介元
                  </h3>
                  <button
                    onClick={() =>
                      router.push(`/customers/${customer.referrer!.id}`)
                    }
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {customer.referrer.name} ({customer.referrer.clientNo})
                  </button>
                </div>
              )}

              {customer.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    備考
                  </h3>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div>
            {customer.deals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2">案件がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customer.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/deals/${deal.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {deal.isImportant && (
                        <span className="text-yellow-500">★</span>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {deal.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {dealProgressLabels[deal.progress] || deal.progress}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            {allTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2">タスクがありません</p>
                <p className="text-sm mt-1">案件経由でタスクを管理できます</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTasks.map((task) => {
                  const statusConfig = taskStatusConfig[task.status]
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                    >
                      {/* チェックボックス */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTaskStatusToggle(task.id, task.status)
                        }}
                        className="flex-shrink-0"
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : task.status === 'IN_PROGRESS' ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>

                      {/* タスク情報 */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className={`font-medium ${task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {task.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="text-gray-400">{task.source}</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>期限: {new Date(task.dueDate).toLocaleDateString('ja-JP')}</span>
                            </>
                          )}
                          {task.assignee && (
                            <>
                              <span>•</span>
                              <span>{task.assignee.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ステータスバッジ */}
                      <span
                        className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2">活動履歴機能は準備中です</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">顧客を削除</h3>
            <p className="text-gray-600 mb-4">
              「{customer.name}」を削除してもよろしいですか？
              関連する案件や履歴も非表示になります。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
