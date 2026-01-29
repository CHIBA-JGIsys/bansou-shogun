'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const customerTypeOptions = [
  { value: 'CLIENT', label: 'クライアント' },
  { value: 'REFERRER', label: '紹介者' },
]

const industryOptions = [
  { value: 'IT', label: 'IT' },
  { value: 'MANUFACTURING', label: '製造' },
  { value: 'RETAIL', label: '小売' },
  { value: 'SERVICE', label: 'サービス' },
  { value: 'OTHER', label: 'その他' },
]

const scaleOptions = [
  { value: 'LARGE', label: '大企業' },
  { value: 'MEDIUM', label: '中企業' },
  { value: 'SMALL', label: '小企業' },
  { value: 'INDIVIDUAL', label: '個人事業主' },
]

const contactToolOptions = [
  { value: 'EMAIL', label: 'メール' },
  { value: 'PHONE', label: '電話' },
  { value: 'CHATWORK', label: 'Chatwork' },
  { value: 'SLACK', label: 'Slack' },
  { value: 'LINE', label: 'LINE' },
  { value: 'ZOOM', label: 'Zoom' },
]

interface FormData {
  name: string
  nameKana: string
  customerTypes: string[]
  contactPerson: string
  contactPersonPhone: string
  email: string
  postalCode: string
  address: string
  website: string
  industry: string
  scale: string
  employeeCount: string
  mainContactTool: string
  subContactTool: string
  chatworkUrl: string
  slackChannel: string
  googleDriveUrl: string
  consultingContract: boolean
  referralFeePercent: string
  notes: string
}

export default function EditCustomerPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clientNo, setClientNo] = useState('')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameKana: '',
    customerTypes: [],
    contactPerson: '',
    contactPersonPhone: '',
    email: '',
    postalCode: '',
    address: '',
    website: '',
    industry: '',
    scale: '',
    employeeCount: '',
    mainContactTool: '',
    subContactTool: '',
    chatworkUrl: '',
    slackChannel: '',
    googleDriveUrl: '',
    consultingContract: false,
    referralFeePercent: '',
    notes: '',
  })

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.data) {
            const customer = data.data
            setClientNo(customer.clientNo)
            setFormData({
              name: customer.name || '',
              nameKana: customer.nameKana || '',
              customerTypes: customer.customerTypes || [],
              contactPerson: customer.contactPerson || '',
              contactPersonPhone: customer.contactPersonPhone || '',
              email: customer.email || '',
              postalCode: customer.postalCode || '',
              address: customer.address || '',
              website: customer.website || '',
              industry: customer.industry || '',
              scale: customer.scale || '',
              employeeCount: customer.employeeCount?.toString() || '',
              mainContactTool: customer.mainContactTool || '',
              subContactTool: customer.subContactTool || '',
              chatworkUrl: customer.chatworkUrl || '',
              slackChannel: customer.slackChannel || '',
              googleDriveUrl: customer.googleDriveUrl || '',
              consultingContract: customer.consultingContract || false,
              referralFeePercent: customer.referralFeePercent?.toString() || '',
              notes: customer.notes || '',
            })
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleCustomerTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      customerTypes: prev.customerTypes.includes(type)
        ? prev.customerTypes.filter((t) => t !== type)
        : [...prev.customerTypes, type],
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '会社名は必須です'
    }

    if (formData.customerTypes.length === 0) {
      newErrors.customerTypes = '顧客タイプを選択してください'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          employeeCount: formData.employeeCount
            ? parseInt(formData.employeeCount)
            : null,
          referralFeePercent: formData.referralFeePercent
            ? parseFloat(formData.referralFeePercent)
            : null,
          industry: formData.industry || null,
          scale: formData.scale || null,
          mainContactTool: formData.mainContactTool || null,
          subContactTool: formData.subContactTool || null,
        }),
      })

      if (res.ok) {
        router.push(`/customers/${id}`)
      } else {
        const error = await res.json()
        alert(error.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update customer:', error)
      alert('更新に失敗しました')
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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <PageHeader
        title="顧客編集"
        description={`${clientNo} - ${formData.name}`}
        backHref={`/customers/${id}`}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="株式会社サンプル"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                会社名（かな）
              </label>
              <input
                type="text"
                name="nameKana"
                value={formData.nameKana}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="かぶしきがいしゃさんぷる"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                顧客タイプ <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {customerTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="inline-flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={formData.customerTypes.includes(option.value)}
                      onChange={() => handleCustomerTypeChange(option.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.customerTypes && (
                <p className="mt-1 text-sm text-red-500">{errors.customerTypes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業種
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事業規模
              </label>
              <select
                name="scale"
                value={formData.scale}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {scaleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                従業員数
              </label>
              <input
                type="number"
                name="employeeCount"
                value={formData.employeeCount}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100"
              />
            </div>

            <div>
              <label className="inline-flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  name="consultingContract"
                  checked={formData.consultingContract}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  コンサルティング契約
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 連絡先情報 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">連絡先情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                担当者名
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
              </label>
              <input
                type="tel"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="03-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="contact@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webサイト
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                郵便番号
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100-0001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                住所
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="東京都千代田区..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メイン連絡ツール
              </label>
              <select
                name="mainContactTool"
                value={formData.mainContactTool}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {contactToolOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                サブ連絡ツール
              </label>
              <select
                name="subContactTool"
                value={formData.subContactTool}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {contactToolOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">備考</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="その他の情報を入力..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/customers/${id}`)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? '更新中...' : '更新'}
          </button>
        </div>
      </form>
    </div>
  )
}
