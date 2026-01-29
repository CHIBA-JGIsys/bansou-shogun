'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProductType, ProductProgress, Probability } from '@prisma/client'
import { Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface Deal {
  id: string
  name: string
  customer: {
    id: string
    name: string
    clientNo: string
  }
}

interface ProductDetail {
  id: string
  name: string
  dealId: string
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
  salesRepId: string | null
  officeRepId: string | null
  deal: Deal
}

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'SPOT', label: '単発' },
  { value: 'STOCK', label: 'ストック' },
]

const PROGRESS_OPTIONS: { value: ProductProgress; label: string }[] = [
  { value: 'NEGOTIATION', label: '交渉' },
  { value: 'PROPOSAL', label: '提案' },
  { value: 'VERBAL_AGREEMENT', label: '口頭承諾' },
  { value: 'CONTRACT', label: '契約' },
]

const PROBABILITY_OPTIONS: { value: Probability; label: string }[] = [
  { value: 'A', label: 'A (高確度)' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D (低確度)' },
]

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

export default function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [error, setError] = useState<string | null>(null)

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    dealId: '',
    productType: 'SPOT' as ProductType,
    progress: 'NEGOTIATION' as ProductProgress,
    probability: '' as Probability | '',
    expectedCloseDate: '',
    orderDate: '',
    deliveryDate: '',
    recordingDate: '',
    recordingStartDate: '',
    expectedAmount: '',
    confirmedAmount: '',
    monthlyAmount: '',
    grossProfit: '',
    referralFee: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 商材と案件一覧を並列で取得
        const [productRes, dealsRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch('/api/deals?limit=100'),
        ])

        if (productRes.ok) {
          const productData = await productRes.json()
          if (productData.success) {
            const p = productData.data as ProductDetail
            setFormData({
              name: p.name,
              dealId: p.deal.id,
              productType: p.productType,
              progress: p.progress,
              probability: p.probability || '',
              expectedCloseDate: formatDateForInput(p.expectedCloseDate),
              orderDate: formatDateForInput(p.orderDate),
              deliveryDate: formatDateForInput(p.deliveryDate),
              recordingDate: formatDateForInput(p.recordingDate),
              recordingStartDate: formatDateForInput(p.recordingStartDate),
              expectedAmount: p.expectedAmount?.toString() || '',
              confirmedAmount: p.confirmedAmount?.toString() || '',
              monthlyAmount: p.monthlyAmount?.toString() || '',
              grossProfit: p.grossProfit?.toString() || '',
              referralFee: p.referralFee?.toString() || '',
            })
          }
        }

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json()
          if (dealsData.success) {
            setDeals(dealsData.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const payload = {
        name: formData.name,
        dealId: formData.dealId,
        productType: formData.productType,
        progress: formData.progress,
        probability: formData.probability || null,
        expectedCloseDate: formData.expectedCloseDate || null,
        orderDate: formData.orderDate || null,
        deliveryDate: formData.deliveryDate || null,
        recordingDate: formData.recordingDate || null,
        recordingStartDate: formData.recordingStartDate || null,
        expectedAmount: formData.expectedAmount ? parseFloat(formData.expectedAmount) : null,
        confirmedAmount: formData.confirmedAmount ? parseFloat(formData.confirmedAmount) : null,
        monthlyAmount: formData.monthlyAmount ? parseFloat(formData.monthlyAmount) : null,
        grossProfit: formData.grossProfit ? parseFloat(formData.grossProfit) : null,
        referralFee: formData.referralFee ? parseFloat(formData.referralFee) : null,
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || '更新に失敗しました')
      }

      router.push(`/products/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  const isSpot = formData.productType === 'SPOT'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="商材を編集"
        description={formData.name}
        backHref={`/products/${id}`}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">基本情報</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商材名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              案件 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.dealId}
              onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">案件を選択...</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name} ({deal.customer.clientNo} - {deal.customer.name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商材種別 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.productType}
                onChange={(e) =>
                  setFormData({ ...formData, productType: e.target.value as ProductType })
                }
                required
                className="w-full px-3 py-2 border rounded-md"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                進捗
              </label>
              <select
                value={formData.progress}
                onChange={(e) =>
                  setFormData({ ...formData, progress: e.target.value as ProductProgress })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                {PROGRESS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確度</label>
            <select
              value={formData.probability}
              onChange={(e) =>
                setFormData({ ...formData, probability: e.target.value as Probability | '' })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">選択なし</option>
              {PROBABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 日付 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">日付</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                成約予定日
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedCloseDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                受注日
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {isSpot ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  納品日
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  計上日
                </label>
                <input
                  type="date"
                  value={formData.recordingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, recordingDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                計上開始日
              </label>
              <input
                type="date"
                value={formData.recordingStartDate}
                onChange={(e) =>
                  setFormData({ ...formData, recordingStartDate: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </div>

        {/* 金額 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">金額</h2>

          {isSpot ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    見込み金額
                  </label>
                  <input
                    type="number"
                    value={formData.expectedAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedAmount: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    確定金額
                  </label>
                  <input
                    type="number"
                    value={formData.confirmedAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmedAmount: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    粗利
                  </label>
                  <input
                    type="number"
                    value={formData.grossProfit}
                    onChange={(e) =>
                      setFormData({ ...formData, grossProfit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    紹介料
                  </label>
                  <input
                    type="number"
                    value={formData.referralFee}
                    onChange={(e) =>
                      setFormData({ ...formData, referralFee: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                月額金額
              </label>
              <input
                type="number"
                value={formData.monthlyAmount}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyAmount: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
