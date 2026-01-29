'use client'

import { useState } from 'react'
import { EntityType, FieldType } from '@prisma/client'
import { FIELD_TYPE_LABELS, isSelectFieldType, SelectOption } from '@/types/field'
import { X, Plus, Trash2 } from 'lucide-react'

interface FieldEditorProps {
  mode: 'create' | 'edit'
  entityType?: EntityType
  initialData?: {
    id: string
    fieldName: string
    fieldLabel: string
    fieldType: FieldType
    isRequired: boolean
    options: SelectOption[] | null
    isSystem: boolean
  }
  onSave: (data: {
    entityType?: EntityType
    fieldName: string
    fieldLabel: string
    fieldType: FieldType
    isRequired: boolean
    options?: SelectOption[]
  }) => Promise<void>
  onClose: () => void
}

export function FieldEditor({ mode, entityType, initialData, onSave, onClose }: FieldEditorProps) {
  const [fieldName, setFieldName] = useState(initialData?.fieldName || '')
  const [fieldLabel, setFieldLabel] = useState(initialData?.fieldLabel || '')
  const [fieldType, setFieldType] = useState<FieldType>(initialData?.fieldType || 'TEXT')
  const [isRequired, setIsRequired] = useState(initialData?.isRequired || false)
  const [options, setOptions] = useState<SelectOption[]>(initialData?.options || [])
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSystem = initialData?.isSystem || false
  const isEdit = mode === 'edit'

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return
    const value = newOptionLabel.toLowerCase().replace(/\s+/g, '_')
    setOptions([...options, { value, label: newOptionLabel.trim() }])
    setNewOptionLabel('')
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // バリデーション
    if (!fieldName.trim()) {
      setError('フィールド名は必須です')
      return
    }
    if (!fieldLabel.trim()) {
      setError('表示ラベルは必須です')
      return
    }
    if (isSelectFieldType(fieldType) && options.length === 0) {
      setError('選択肢を1つ以上追加してください')
      return
    }

    setSaving(true)
    try {
      await onSave({
        entityType,
        fieldName: fieldName.trim(),
        fieldLabel: fieldLabel.trim(),
        fieldType,
        isRequired,
        options: isSelectFieldType(fieldType) ? options : undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'フィールドを編集' : 'フィールドを追加'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フィールド名（内部名）
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              disabled={isEdit}
              placeholder="例: custom_field_1"
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              英数字とアンダースコアのみ。作成後は変更できません。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表示ラベル
            </label>
            <input
              type="text"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              disabled={isSystem}
              placeholder="例: カスタム項目1"
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フィールドタイプ
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as FieldType)}
              disabled={isSystem}
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isSelectFieldType(fieldType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                選択肢
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index] = { ...option, label: e.target.value }
                        setOptions(newOptions)
                      }}
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddOption()
                      }
                    }}
                    placeholder="選択肢を入力..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              disabled={isSystem}
              className="h-4 w-4"
            />
            <label htmlFor="isRequired" className="text-sm text-gray-700">
              必須フィールドにする
            </label>
          </div>

          {isSystem && (
            <p className="text-sm text-amber-600">
              システムフィールドのため、一部の設定は変更できません。
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
