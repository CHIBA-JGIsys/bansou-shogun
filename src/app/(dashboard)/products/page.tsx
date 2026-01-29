'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProductType, ProductProgress, Probability } from '@prisma/client'
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { KanbanBoard, ColumnConfig } from '@/components/kanban'
import { PageHeader, ViewToggle } from '@/components/ui/page-header'
import { useDebounce } from '@/hooks/useDebounce'

interface Product {
  id: string
  name: string
  productType: ProductType
  progress: ProductProgress
  probability: Probability | null
  expectedAmount: number | null
  confirmedAmount: number | null
  monthlyAmount: number | null
  orderDate: string | null
  createdAt: string
  deal: {
    id: string
    name: string
    customer: {
      id: string
      name: string
      clientNo: string
    }
  }
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
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

const PROBABILITY_COLORS: Record<Probability, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-gray-100 text-gray-700',
}

// カンバンカラム構成
const KANBAN_COLUMNS: ColumnConfig[] = [
  { id: 'NEGOTIATION', title: '商談中', color: '#6b7280' },
  { id: 'PROPOSAL', title: '提案中', color: '#3b82f6' },
  { id: 'VERBAL_AGREEMENT', title: '内諾', color: '#f97316' },
  { id: 'CONTRACT', title: '契約済み', color: '#22c55e' },
]

type ViewMode = 'list' | 'kanban'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [productTypeFilter, setProductTypeFilter] = useState<string>('')
  const [progressFilter, setProgressFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // ビューモード
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (productTypeFilter) params.set('productType', productTypeFilter)
      if (progressFilter) params.set('progress', progressFilter)

      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setProducts(data.data)
          setMeta(data.meta)
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, productTypeFilter, progressFilter, sortBy, sortOrder])

  // デバウンスされた検索が変わったらページを1に戻す
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }


  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const getAmount = (product: Product) => {
    if (product.productType === 'STOCK') {
      return product.monthlyAmount
    }
    return product.orderDate ? product.confirmedAmount : product.expectedAmount
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    )
  }

  // カンバンビューでのステータス更新（楽観的更新）
  const handleProductMove = useCallback(async (productId: string, newProgress: string) => {
    // 1. 楽観的更新: 即座にUI反映
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, progress: newProgress as ProductProgress }
          : product
      )
    )

    // 2. API呼び出し
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      })
      if (!res.ok) {
        // 3. 失敗時のロールバック
        console.error('Failed to update product progress')
        fetchProducts()
      }
    } catch (error) {
      // 3. エラー時のロールバック
      console.error('Failed to update product progress:', error)
      fetchProducts()
    }
  }, [fetchProducts])

  // カンバンカードのレンダリング
  const renderProductCard = (product: Product) => {
    return (
      <div
        onClick={() => router.push(`/products/${product.id}`)}
        className="cursor-pointer"
      >
        <div className="font-medium text-sm mb-1">{product.name}</div>
        <div className="text-xs text-muted-foreground mb-2">
          {product.deal.name}
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${PROGRESS_COLORS[product.progress]}`}>
            {PROGRESS_LABELS[product.progress]}
          </span>
          <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
            {PRODUCT_TYPE_LABELS[product.productType]}
          </span>
          {product.probability && (
            <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${PROBABILITY_COLORS[product.probability]}`}>
              確度{PROBABILITY_LABELS[product.probability]}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-gray-500">{product.deal.customer.name}</span>
          <span className="font-medium">
            {formatCurrency(getAmount(product))}
            {product.productType === 'STOCK' && <span className="text-gray-400">/月</span>}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="商材管理"
        description="商材の一覧と管理"
        actions={
          <>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            <button
              onClick={() => router.push('/products/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新規作成</span>
              <span className="sm:hidden">追加</span>
            </button>
          </>
        }
      />

      {/* フィルター・検索 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="商材名で検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
          <select
            value={productTypeFilter}
            onChange={(e) => {
              setProductTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">種別: すべて</option>
            <option value="SPOT">単発</option>
            <option value="STOCK">ストック</option>
          </select>
          <select
            value={progressFilter}
            onChange={(e) => {
              setProgressFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">進捗: すべて</option>
            {Object.entries(PROGRESS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product View */}
      {loading ? (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          読み込み中...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          <p>商材がありません</p>
          <button
            onClick={() => router.push('/products/new')}
            className="mt-2 text-primary hover:underline"
          >
            最初の商材を作成
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban View */
        <div className="overflow-x-auto">
          <KanbanBoard
          columns={KANBAN_COLUMNS}
          items={products}
          getItemColumn={(product) => product.progress}
          onItemMove={handleProductMove}
          renderCard={renderProductCard}
          />
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  >
                    商材名
                    <SortIcon field="name" />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    案件 / 顧客
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    種別
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    進捗
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    確度
                  </th>
                  <th
                    onClick={() => handleSort('expectedAmount')}
                    className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  >
                    金額
                    <SortIcon field="expectedAmount" />
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                  >
                    作成日
                    <SortIcon field="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{product.deal.name}</div>
                      <div className="text-gray-500 text-xs">
                        {product.deal.customer.clientNo} - {product.deal.customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-gray-100">
                        {PRODUCT_TYPE_LABELS[product.productType]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${PROGRESS_COLORS[product.progress]}`}
                      >
                        {PROGRESS_LABELS[product.progress]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.probability && (
                        <span
                          className={`px-2 py-1 text-xs rounded ${PROBABILITY_COLORS[product.probability]}`}
                        >
                          {PROBABILITY_LABELS[product.probability]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {formatCurrency(getAmount(product))}
                      {product.productType === 'STOCK' && (
                        <span className="text-gray-400 text-xs">/月</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      )}

      {/* Pagination (List view only) */}
      {viewMode === 'list' && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {meta.total} 件中 {(meta.page - 1) * meta.limit + 1} -{' '}
            {Math.min(meta.page * meta.limit, meta.total)} 件を表示
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-md border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
