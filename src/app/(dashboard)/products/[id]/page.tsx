'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ProductType,
  ProductProgress,
  Probability,
  TaskStatus,
  TaskType,
} from '@prisma/client'
import {
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  Plus,
  X,
  FileText,
  List,
  LayoutGrid,
} from 'lucide-react'
import { KanbanBoard, ColumnConfig } from '@/components/kanban/KanbanBoard'
import { PageHeader } from '@/components/ui/page-header'

interface ProductDetail {
  id: string
  name: string
  productType: ProductType
  progress: ProductProgress
  probability: Probability | null
  expectedCloseDate: string | null
  orderDate: string | null
  deliveryDate: string | null
  recordingDate: string | null
  recordingStartDate: string | null
  expectedAmount: number | null
  confirmedAmount: number | null
  monthlyAmount: number | null
  grossProfit: number | null
  referralFee: number | null
  createdAt: string
  updatedAt: string
  deal: {
    id: string
    name: string
    progress: string
    customer: {
      id: string
      name: string
      clientNo: string
    }
  }
  salesRep: { id: string; name: string; email: string } | null
  officeRep: { id: string; name: string; email: string } | null
  todos: {
    id: string
    name: string
    completed: boolean
    order: number
  }[]
  tasks: {
    id: string
    name: string
    status: TaskStatus
    taskType: TaskType | null
    dueDate: string | null
    assignee: { id: string; name: string } | null
  }[]
}

interface TodoTemplate {
  id: string
  name: string
  description: string | null
  items: { id: string; name: string; order: number }[]
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  SPOT: '単発',
  STOCK: 'ストック',
}

const PROGRESS_LABELS: Record<ProductProgress, string> = {
  NEGOTIATION: '交渉',
  PROPOSAL: '提案',
  VERBAL_AGREEMENT: '口頭承諾',
  CONTRACT: '契約',
}

const PROGRESS_COLORS: Record<ProductProgress, string> = {
  NEGOTIATION: 'bg-gray-100 text-gray-700',
  PROPOSAL: 'bg-blue-100 text-blue-700',
  VERBAL_AGREEMENT: 'bg-orange-100 text-orange-700',
  CONTRACT: 'bg-green-100 text-green-700',
}

const PROBABILITY_LABELS: Record<Probability, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: '未着手',
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
}

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
}

// カンバンボード用カラム設定
const TASK_KANBAN_COLUMNS: ColumnConfig[] = [
  { id: 'TODO', title: '未着手', color: '#6b7280' },
  { id: 'IN_PROGRESS', title: '進行中', color: '#3b82f6' },
  { id: 'COMPLETED', title: '完了', color: '#22c55e' },
]

export default function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'todos' | 'tasks'>('info')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // TODO関連の状態
  const [newTodoName, setNewTodoName] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<TodoTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  // タスクビュー切替（リスト/カンバン）
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'kanban'>('list')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setProduct(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/products')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setDeleting(false)
      setDeleteConfirm(false)
    }
  }

  // TODO追加
  const handleAddTodo = async () => {
    if (!newTodoName.trim()) return
    setAddingTodo(true)
    try {
      const res = await fetch(`/api/products/${id}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTodoName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && product) {
          setProduct({
            ...product,
            todos: [...product.todos, data.data],
          })
          setNewTodoName('')
          setShowTodoForm(false)
        }
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setAddingTodo(false)
    }
  }

  // TODO完了/未完了トグル
  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })
      if (res.ok && product) {
        setProduct({
          ...product,
          todos: product.todos.map((todo) =>
            todo.id === todoId ? { ...todo, completed: !completed } : todo
          ),
        })
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  // TODO削除
  const handleDeleteTodo = async (todoId: string) => {
    try {
      const res = await fetch(`/api/products/${id}/todos/${todoId}`, {
        method: 'DELETE',
      })
      if (res.ok && product) {
        setProduct({
          ...product,
          todos: product.todos.filter((todo) => todo.id !== todoId),
        })
      }
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  // テンプレート一覧取得
  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true)
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/todo-templates')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setTemplates(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // テンプレートからTODO一括追加
  const handleAddFromTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/products/${id}/todos/from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && product) {
          setProduct({
            ...product,
            todos: data.data,
          })
          setShowTemplateModal(false)
        }
      }
    } catch (error) {
      console.error('Failed to add todos from template:', error)
    }
  }

  // タスクステータス更新（カンバンドラッグ用）
  const handleTaskMove = async (taskId: string, newStatus: string) => {
    if (!product) return
    // 楽観的UI更新
    setProduct({
      ...product,
      tasks: product.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus as TaskStatus } : task
      ),
    })
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        // エラー時にロールバック（再取得）
        const fetchRes = await fetch(`/api/products/${id}`)
        if (fetchRes.ok) {
          const data = await fetchRes.json()
          if (data.success) {
            setProduct(data.data)
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-gray-500">商材が見つかりません</div>
        <button
          onClick={() => router.push('/products')}
          className="text-blue-600 hover:underline"
        >
          一覧に戻る
        </button>
      </div>
    )
  }

  const isSpot = product.productType === 'SPOT'

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            <span>{product.name}</span>
            <span className="text-sm text-gray-500 font-normal">
              {PRODUCT_TYPE_LABELS[product.productType]}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${PROGRESS_COLORS[product.progress]}`}
            >
              {PROGRESS_LABELS[product.progress]}
            </span>
            {product.probability && (
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100">
                確度{PROBABILITY_LABELS[product.probability]}
              </span>
            )}
          </span>
        }
        backHref="/products"
        actions={
          <>
            <button
              onClick={() => router.push(`/tasks/new?productId=${id}`)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">タスク作成</span>
            </button>
            <button
              onClick={() => router.push(`/products/${id}/edit`)}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">編集</span>
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">削除</span>
            </button>
          </>
        }
      />

      {/* 案件・顧客リンク */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-600">案件</div>
            <div className="font-medium">{product.deal.name}</div>
            <div className="text-sm text-gray-500">
              {product.deal.customer.clientNo} - {product.deal.customer.name}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push(`/deals/${product.deal.id}`)}
              className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
              案件を見る
              <ExternalLink className="h-4 w-4" />
            </button>
            <Link
              href={`/customers/${product.deal.customer.id}`}
              className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
              {product.deal.customer.name} を見る
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-4 min-w-max">
          {[
            { id: 'info', label: '基本情報' },
            { id: 'todos', label: `TODO (${product.todos.length})` },
            { id: 'tasks', label: `タスク (${product.tasks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* 金額情報 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">金額情報</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {isSpot ? (
                  <>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm text-gray-500">見込み金額</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(product.expectedAmount)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm text-gray-500">確定金額</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(product.confirmedAmount)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm text-gray-500">粗利</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(product.grossProfit)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-sm text-gray-500">紹介料</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(product.referralFee)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-sm text-gray-500">月額金額</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(product.monthlyAmount)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 日付情報 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">日付情報</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">成約予定日</div>
                  <div>{formatDate(product.expectedCloseDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">受注日</div>
                  <div>{formatDate(product.orderDate)}</div>
                </div>
                {isSpot ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">納品日</div>
                      <div>{formatDate(product.deliveryDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">計上日</div>
                      <div>{formatDate(product.recordingDate)}</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-sm text-gray-500">計上開始日</div>
                    <div>{formatDate(product.recordingStartDate)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 担当者 */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">担当者</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">営業担当</div>
                  <div>{product.salesRep?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">事務担当</div>
                  <div>{product.officeRep?.name || '-'}</div>
                </div>
              </div>
            </div>

            {/* メタ情報 */}
            <div className="pt-4 border-t text-sm text-gray-500">
              <div>作成日: {formatDate(product.createdAt)}</div>
              <div>更新日: {formatDate(product.updatedAt)}</div>
            </div>
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="space-y-4">
            {/* アクションボタン */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTodoForm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                TODO追加
              </button>
              <button
                onClick={handleOpenTemplateModal}
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                テンプレートから追加
              </button>
            </div>

            {/* TODO追加フォーム */}
            {showTodoForm && (
              <div className="flex items-center gap-2 p-3 border rounded bg-gray-50">
                <input
                  type="text"
                  value={newTodoName}
                  onChange={(e) => setNewTodoName(e.target.value)}
                  placeholder="TODO名を入力..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTodo()
                    if (e.key === 'Escape') {
                      setShowTodoForm(false)
                      setNewTodoName('')
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddTodo}
                  disabled={addingTodo || !newTodoName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingTodo ? '追加中...' : '追加'}
                </button>
                <button
                  onClick={() => {
                    setShowTodoForm(false)
                    setNewTodoName('')
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* TODOリスト */}
            <div className="space-y-2">
              {product.todos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  TODOはありません
                </div>
              ) : (
                product.todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 group"
                  >
                    <button
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                      className="flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        todo.completed ? 'line-through text-gray-400' : ''
                      }`}
                    >
                      {todo.name}
                    </span>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* リスト/カンバン切替ボタン */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTaskViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  taskViewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
                リスト
              </button>
              <button
                onClick={() => setTaskViewMode('kanban')}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  taskViewMode === 'kanban'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                カンバン
              </button>
            </div>

            {product.tasks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                タスクはありません
              </div>
            ) : taskViewMode === 'list' ? (
              /* リストビュー */
              <div className="space-y-2">
                {product.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">
                        {task.assignee?.name || '未割当'}
                        {task.dueDate && ` / 期限: ${formatDate(task.dueDate)}`}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${TASK_STATUS_COLORS[task.status]}`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* カンバンビュー */
              <div className="overflow-x-auto">
                <KanbanBoard
                columns={TASK_KANBAN_COLUMNS}
                items={product.tasks}
                getItemColumn={(task) => task.status}
                onItemMove={handleTaskMove}
                renderCard={(task) => (
                  <div
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="font-medium text-sm">{task.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.assignee?.name || '未割当'}
                    </div>
                    {task.dueDate && (
                      <div className="text-xs text-gray-400 mt-1">
                        期限: {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                )}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">商材を削除</h3>
            <p className="text-gray-600 mb-4">
              「{product.name}」を削除してもよろしいですか？
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
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* テンプレート選択モーダル */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">テンプレートから追加</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {loadingTemplates ? (
              <div className="text-center text-gray-500 py-8">
                読み込み中...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                テンプレートがありません
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleAddFromTemplate(template.id)}
                    className="w-full text-left p-3 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {template.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {template.items.length}件のTODO
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
