"use client";

import { useState, useEffect } from "react";
import { Plus, ListTodo, GripVertical, Pencil, Trash2, X, Save, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TodoItem {
  id?: string;
  name: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  items: TodoItem[];
  createdAt: string;
  updatedAt: string;
}

interface FormItem {
  id: string;
  name: string;
  order: number;
}

// Sortable Item Component for drag & drop
function SortableItem({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: FormItem;
  index: number;
  onUpdate: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
      <input
        type="text"
        value={item.name}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="TODOアイテム名"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="rounded-md p-2 hover:bg-gray-100 disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 編集/作成モーダル用
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    items: [{ id: "item-0", name: "", order: 0 }] as FormItem[],
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 削除確認
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/todo-templates");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      items: [{ id: `item-${Date.now()}`, name: "", order: 0 }],
    });
    setShowModal(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      items: template.items.length > 0
        ? template.items.map((item, idx) => ({ id: `item-${idx}-${Date.now()}`, name: item.name, order: item.order }))
        : [{ id: `item-${Date.now()}`, name: "", order: 0 }],
    });
    setShowModal(true);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: `item-${Date.now()}-${prev.items.length}`, name: "", order: prev.items.length }],
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.items.findIndex((item) => item.id === active.id);
        const newIndex = prev.items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(prev.items, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order: idx,
        }));

        return { ...prev, items: newItems };
      });
    }
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId).map((item, i) => ({ ...item, order: i })),
    }));
  };

  const updateItem = (itemId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, name: value } : item)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("テンプレート名は必須です");
      return;
    }

    const validItems = formData.items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      alert("少なくとも1つのTODOアイテムが必要です");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        items: validItems.map((item, index) => ({ name: item.name.trim(), order: index })),
      };

      const url = editingTemplate
        ? `/api/todo-templates/${editingTemplate.id}`
        : "/api/todo-templates";
      const method = editingTemplate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchTemplates();
      } else {
        alert(data.error || "保存に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/todo-templates/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setDeleteConfirm(null);
        fetchTemplates();
      } else {
        alert(data.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">TODOテンプレート管理</h2>
          <p className="text-sm text-muted-foreground">
            商材に適用できるTODOテンプレートを管理します
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          テンプレートを作成
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(template)}
                  className="rounded-md p-2 hover:bg-muted"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(template.id)}
                  className="rounded-md p-2 hover:bg-muted"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* TODO Items */}
            <div className="mt-4 space-y-2">
              {template.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              {template.items.length}件のTODOアイテム
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ListTodo className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            TODOテンプレートを作成して、業務効率を向上させましょう
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTemplate ? "テンプレートを編集" : "テンプレートを作成"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  テンプレート名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="例: 契約完了後フロー"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="例: 契約締結後の標準的なTODOリスト"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  TODOアイテム <span className="text-red-500">*</span>
                  <span className="text-xs text-muted-foreground ml-2">（ドラッグで並べ替え可能）</span>
                </label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          index={index}
                          onUpdate={(value) => updateItem(item.id, value)}
                          onRemove={() => removeItem(item.id)}
                          canRemove={formData.items.length > 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  アイテムを追加
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">テンプレートを削除</h3>
            <p className="text-gray-600 mb-4">
              このテンプレートを削除してもよろしいですか？
              この操作は取り消せません。
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
  );
}
