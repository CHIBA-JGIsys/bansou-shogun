'use client'

import { useState, useEffect, useCallback } from 'react'
import { EntityType, FieldType } from '@prisma/client'
import { FieldEditor } from '@/components/settings/FieldEditor'
import {
  ENTITY_TYPE_LABELS,
  FIELD_TYPE_LABELS,
  SelectOption,
} from '@/types/field'
import { Plus, Pencil, Trash2, GripVertical, Lock } from 'lucide-react'

interface FieldDefinition {
  id: string
  entityType: EntityType
  fieldName: string
  fieldLabel: string
  fieldType: FieldType
  isRequired: boolean
  options: SelectOption[] | null
  order: number
  isSystem: boolean
}

const ENTITY_TYPES: EntityType[] = ['CUSTOMER', 'DEAL', 'PRODUCT', 'TASK']

export default function FieldsSettingsPage() {
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [activeTab, setActiveTab] = useState<EntityType>('CUSTOMER')
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchFields = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fields?entity=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setFields(data)
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  const handleCreate = async (data: {
    entityType?: EntityType
    fieldName: string
    fieldLabel: string
    fieldType: FieldType
    isRequired: boolean
    options?: SelectOption[]
  }) => {
    const res = await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, entityType: activeTab }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create field')
    }

    await fetchFields()
  }

  const handleUpdate = async (data: {
    fieldLabel: string
    fieldType: FieldType
    isRequired: boolean
    options?: SelectOption[]
  }) => {
    if (!editingField) return

    const res = await fetch(`/api/fields/${editingField.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to update field')
    }

    await fetchFields()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/fields/${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const error = await res.json()
      alert(error.error || 'Failed to delete field')
      return
    }

    setDeleteConfirm(null)
    await fetchFields()
  }

  const openCreateModal = () => {
    setEditingField(null)
    setShowEditor(true)
  }

  const openEditModal = (field: FieldDefinition) => {
    setEditingField(field)
    setShowEditor(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">フィールド管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            各エンティティのカスタムフィールドを管理します
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          フィールドを追加
        </button>
      </div>

      {/* タブ（横スクロール対応） */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-2 md:gap-4 whitespace-nowrap">
          {ENTITY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-3 md:px-4 py-2 border-b-2 font-medium text-sm transition-colors shrink-0 ${
                activeTab === type
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {ENTITY_TYPE_LABELS[type]}
            </button>
          ))}
        </nav>
      </div>

      {/* フィールド一覧 */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : fields.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>フィールドがありません</p>
            <button
              onClick={openCreateModal}
              className="mt-2 text-blue-600 hover:underline"
            >
              最初のフィールドを追加
            </button>
          </div>
        ) : (
          <>
            {/* モバイル表示: カード */}
            <div className="block md:hidden divide-y">
              {fields.map((field) => (
                <div key={field.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {field.fieldLabel}
                          {field.isSystem && (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{field.fieldName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(field)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!field.isSystem && (
                        <button
                          onClick={() => setDeleteConfirm(field.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">タイプ: </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {FIELD_TYPE_LABELS[field.fieldType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">必須: </span>
                      {field.isRequired ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* デスクトップ表示: テーブル */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="w-8 px-4 py-3"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      表示ラベル
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      フィールド名
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      タイプ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      必須
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {field.fieldLabel}
                          {field.isSystem && (
                            <span title="システムフィールド">
                              <Lock className="h-3 w-3 text-gray-400" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {field.fieldName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {FIELD_TYPE_LABELS[field.fieldType]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {field.isRequired ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(field)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="編集"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {!field.isSystem && (
                            <button
                              onClick={() => setDeleteConfirm(field.id)}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="削除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* フィールドエディタモーダル */}
      {showEditor && (
        <FieldEditor
          mode={editingField ? 'edit' : 'create'}
          entityType={activeTab}
          initialData={editingField || undefined}
          onSave={editingField ? handleUpdate : handleCreate}
          onClose={() => {
            setShowEditor(false)
            setEditingField(null)
          }}
        />
      )}

      {/* 削除確認モーダル */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">フィールドを削除</h3>
            <p className="text-gray-600 mb-4">
              このフィールドを削除してもよろしいですか？この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
