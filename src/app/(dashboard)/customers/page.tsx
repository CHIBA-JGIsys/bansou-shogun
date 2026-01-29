'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { useDebounce } from '@/hooks/useDebounce'

interface Customer {
  id: string
  clientNo: string
  name: string
  nameKana: string | null
  customerTypes: string[]
  contactPerson: string | null
  email: string | null
  industry: string | null
  scale: string | null
  mainSalesRep: { id: string; name: string } | null
  _count: { deals: number }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const scaleLabels: Record<string, string> = {
  LARGE: '大企業',
  MEDIUM: '中企業',
  SMALL: '小企業',
  INDIVIDUAL: '個人事業主',
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [sortBy] = useState('createdAt')
  const [sortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
      })

      const res = await fetch(`/api/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setCustomers(data.data || [])
          setPagination(data.pagination || pagination)
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, sortBy, sortOrder])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // デバウンスされた検索が変わったらページを1に戻す
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [debouncedSearch])

  // テーブルカラム定義
  const columns = [
    {
      key: 'clientNo' as const,
      header: '顧客番号',
      render: (customer: Customer) => (
        <span className="font-mono text-gray-600">{customer.clientNo}</span>
      ),
    },
    {
      key: 'name' as const,
      header: '会社名',
      render: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            {customer.nameKana && (
              <div className="text-xs text-gray-500">{customer.nameKana}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'customerTypes' as const,
      header: 'タイプ',
      render: (customer: Customer) => (
        <div className="flex flex-wrap gap-1">
          {customer.customerTypes.map((type) => (
            <span
              key={type}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                type === 'CLIENT'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {customerTypeLabels[type] || type}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'contactPerson' as const,
      header: '担当者',
      render: (customer: Customer) => customer.contactPerson || '-',
    },
    {
      key: 'industry' as const,
      header: '業種',
      render: (customer: Customer) =>
        customer.industry ? industryLabels[customer.industry] || customer.industry : '-',
    },
    {
      key: 'mainSalesRep' as const,
      header: '営業担当',
      render: (customer: Customer) => customer.mainSalesRep?.name || '-',
    },
    {
      key: '_count' as const,
      header: '案件数',
      render: (customer: Customer) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-3 w-3" />
          {customer._count?.deals || 0}
        </span>
      ),
    },
    {
      key: 'createdAt' as const,
      header: '作成日',
      render: (customer: Customer) =>
        new Date(customer.createdAt).toLocaleDateString('ja-JP'),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <PageHeader
        title="顧客管理"
        description="顧客情報の一覧・作成・編集を行います"
        actions={
          <button
            onClick={() => router.push('/customers/new')}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新規作成</span>
            <span className="sm:hidden">追加</span>
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="会社名、担当者名、顧客番号で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2">顧客が見つかりません</p>
            <button
              onClick={() => router.push('/customers/new')}
              className="mt-4 text-blue-600 hover:underline"
            >
              最初の顧客を登録
            </button>
          </div>
        ) : (
          <ResponsiveTable
            data={customers}
            columns={columns}
            primaryField="name"
            onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
      )}

      {/* Stats */}
      <div className="text-sm text-gray-500">
        合計: {pagination.total}社
      </div>
    </div>
  )
}
