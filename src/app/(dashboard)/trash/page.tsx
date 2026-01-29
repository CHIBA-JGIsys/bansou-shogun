'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Building2,
  Briefcase,
  Package,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader } from '@/components/ui/page-header'

type EntityType = 'customer' | 'deal' | 'product' | 'task'

interface DeletedCustomer {
  id: string
  clientNo: string
  name: string
  nameKana: string | null
  deletedAt: string
  createdAt: string
}

interface DeletedDeal {
  id: string
  name: string
  progress: string
  deletedAt: string
  createdAt: string
  customer: { id: string; name: string; clientNo: string } | null
}

interface DeletedProduct {
  id: string
  name: string
  productType: string
  progress: string
  deletedAt: string
  createdAt: string
  deal: {
    id: string
    name: string
    customer: { id: string; name: string } | null
  } | null
}

interface DeletedTask {
  id: string
  name: string
  status: string
  taskType: string | null
  deletedAt: string
  createdAt: string
  deal: { id: string; name: string } | null
  product: { id: string; name: string } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const progressLabels: Record<string, string> = {
  LEAD: 'リード',
  FIRST_MEETING: '初回面談',
  ESTIMATE_PENDING: '明細待ち',
  ESTIMATE_RECEIVED: '明細取得済み',
}

const productProgressLabels: Record<string, string> = {
  NEGOTIATION: '交渉',
  PROPOSAL: '提案',
  VERBAL_AGREEMENT: '口頭承諾',
  CONTRACT: '契約',
}

const productTypeLabels: Record<string, string> = {
  ONE_TIME: '単発',
  RECURRING: 'ストック',
}

const taskStatusLabels: Record<string, string> = {
  NOT_STARTED: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
}

const taskTypeLabels: Record<string, string> = {
  ESTIMATE: '見積作成',
  CONTRACT: '契約書作成',
  INVOICE: '請求書発行',
  DELIVERY: '納品対応',
  OTHER: 'その他',
}

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<EntityType>('customer')
  const [customers, setCustomers] = useState<DeletedCustomer[]>([])
  const [deals, setDeals] = useState<DeletedDeal[]>([])
  const [products, setProducts] = useState<DeletedProduct[]>([])
  const [tasks, setTasks] = useState<DeletedTask[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 確認ダイアログの状態
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'restore' | 'delete'
    entityType: EntityType
    id: string
    name: string
  } | null>(null)

  const fetchDeletedItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      const res = await fetch(`/api/trash?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          switch (activeTab) {
            case 'customer':
              setCustomers(data.data || [])
              break
            case 'deal':
              setDeals(data.data || [])
              break
            case 'product':
              setProducts(data.data || [])
              break
            case 'task':
              setTasks(data.data || [])
              break
          }
          setPagination((prev) => ({
            ...prev,
            total: data.meta?.total || 0,
            totalPages: data.meta?.totalPages || 0,
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch deleted items:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, pagination.page, pagination.limit])

  useEffect(() => {
    fetchDeletedItems()
  }, [fetchDeletedItems])

  const handleTabChange = (value: string) => {
    setActiveTab(value as EntityType)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleRestore = async (entityType: EntityType, id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, id }),
      })
      if (res.ok) {
        await fetchDeletedItems()
      }
    } catch (error) {
      console.error('Failed to restore:', error)
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  const handlePermanentDelete = async (entityType: EntityType, id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, id }),
      })
      if (res.ok) {
        await fetchDeletedItems()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }

  const openConfirmDialog = (
    type: 'restore' | 'delete',
    entityType: EntityType,
    id: string,
    name: string
  ) => {
    setConfirmDialog({ isOpen: true, type, entityType, id, name })
  }

  const entityTypeLabels: Record<EntityType, string> = {
    customer: '顧客',
    deal: '案件',
    product: '商材',
    task: 'タスク',
  }

  const renderEmptyState = (icon: React.ReactNode, entityName: string) => (
    <div className="p-8 text-center text-gray-500">
      {icon}
      <p className="mt-2">削除された{entityName}はありません</p>
    </div>
  )

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-500">
          {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}〜
          {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            disabled={pagination.page === 1}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            disabled={pagination.page === pagination.totalPages}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderActionButtons = (
    entityType: EntityType,
    id: string,
    name: string
  ) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation()
          openConfirmDialog('restore', entityType, id, name)
        }}
        disabled={actionLoading === id}
        className="inline-flex items-center justify-center gap-1 rounded-md bg-green-50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
        復元
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          openConfirmDialog('delete', entityType, id, name)
        }}
        disabled={actionLoading === id}
        className="inline-flex items-center justify-center gap-1 rounded-md bg-red-50 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">完全に</span>削除
      </button>
    </div>
  )

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <PageHeader
        title="ゴミ箱"
        description="削除されたデータの復元・完全削除を行います"
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto whitespace-nowrap pb-2">
          <TabsList className="inline-flex w-auto min-w-full sm:w-auto lg:w-[500px]">
            <TabsTrigger value="customer" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Building2 className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">顧客</span>
            </TabsTrigger>
            <TabsTrigger value="deal" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Briefcase className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">案件</span>
            </TabsTrigger>
            <TabsTrigger value="product" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <Package className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">商材</span>
            </TabsTrigger>
            <TabsTrigger value="task" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">タスク</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 顧客タブ */}
        <TabsContent value="customer">
          <div className="rounded-lg border bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : customers.length === 0 ? (
              renderEmptyState(
                <Building2 className="mx-auto h-10 w-10 text-gray-300" />,
                '顧客'
              )
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        顧客番号
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        会社名
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        削除日
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {customer.clientNo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.name}
                              </div>
                              {customer.nameKana && (
                                <div className="text-xs text-gray-500">
                                  {customer.nameKana}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(customer.deletedAt).toLocaleDateString(
                            'ja-JP'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {renderActionButtons(
                            'customer',
                            customer.id,
                            customer.name
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination()}
              </>
            )}
          </div>
        </TabsContent>

        {/* 案件タブ */}
        <TabsContent value="deal">
          <div className="rounded-lg border bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : deals.length === 0 ? (
              renderEmptyState(
                <Briefcase className="mx-auto h-10 w-10 text-gray-300" />,
                '案件'
              )
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        案件名
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        顧客
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        進捗
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        削除日
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            <div className="font-medium text-gray-900">
                              {deal.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {deal.customer?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {progressLabels[deal.progress] || deal.progress}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(deal.deletedAt).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-3">
                          {renderActionButtons('deal', deal.id, deal.name)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination()}
              </>
            )}
          </div>
        </TabsContent>

        {/* 商材タブ */}
        <TabsContent value="product">
          <div className="rounded-lg border bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : products.length === 0 ? (
              renderEmptyState(
                <Package className="mx-auto h-10 w-10 text-gray-300" />,
                '商材'
              )
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        商材名
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        案件/顧客
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        種別
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        進捗
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        削除日
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="font-medium text-gray-900">
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{product.deal?.name || '-'}</div>
                          <div className="text-xs text-gray-400">
                            {product.deal?.customer?.name || ''}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              product.productType === 'ONE_TIME'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {productTypeLabels[product.productType] ||
                              product.productType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {productProgressLabels[product.progress] ||
                              product.progress}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(product.deletedAt).toLocaleDateString(
                            'ja-JP'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {renderActionButtons(
                            'product',
                            product.id,
                            product.name
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination()}
              </>
            )}
          </div>
        </TabsContent>

        {/* タスクタブ */}
        <TabsContent value="task">
          <div className="rounded-lg border bg-white shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : tasks.length === 0 ? (
              renderEmptyState(
                <CheckSquare className="mx-auto h-10 w-10 text-gray-300" />,
                'タスク'
              )
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        タスク名
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        紐づき
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        種別
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        ステータス
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        削除日
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <CheckSquare className="h-4 w-4" />
                            </div>
                            <div className="font-medium text-gray-900">
                              {task.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.product?.name ||
                            task.deal?.name ||
                            '単体タスク'}
                        </td>
                        <td className="px-4 py-3">
                          {task.taskType ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {taskTypeLabels[task.taskType] || task.taskType}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : task.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {taskStatusLabels[task.status] || task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(task.deletedAt).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-3">
                          {renderActionButtons('task', task.id, task.name)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderPagination()}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 確認ダイアログ */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* オーバーレイ */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDialog(null)}
          />

          {/* ダイアログ */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={() => setConfirmDialog(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  confirmDialog.type === 'delete'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {confirmDialog.type === 'delete' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmDialog.type === 'delete' ? '完全に削除' : '復元'}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {confirmDialog.type === 'delete' ? (
                    <>
                      「{confirmDialog.name}」を完全に削除しますか？
                      <br />
                      <span className="text-red-600 font-medium">
                        この操作は取り消せません。
                      </span>
                    </>
                  ) : (
                    <>
                      「{confirmDialog.name}」を復元しますか？
                      <br />
                      {entityTypeLabels[confirmDialog.entityType]}
                      一覧に戻ります。
                    </>
                  )}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      if (confirmDialog.type === 'delete') {
                        handlePermanentDelete(
                          confirmDialog.entityType,
                          confirmDialog.id
                        )
                      } else {
                        handleRestore(confirmDialog.entityType, confirmDialog.id)
                      }
                    }}
                    disabled={actionLoading === confirmDialog.id}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                      confirmDialog.type === 'delete'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {actionLoading === confirmDialog.id
                      ? '処理中...'
                      : confirmDialog.type === 'delete'
                      ? '完全に削除'
                      : '復元'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
