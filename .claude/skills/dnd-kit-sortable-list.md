# dnd-kit-sortable-list

編集モーダル内のリストアイテムをドラッグ&ドロップで並べ替え可能にするパターン

## 概要

@dnd-kit を使用して、フォーム内のリストアイテムをドラッグ&ドロップで並べ替え可能にする実装パターン。TODOリスト、優先順位リスト、ステップリストなど、順序が重要なリストに適用可能。

## 使用場面

- TODOテンプレートの編集（アイテム順序）
- ワークフローステップの並べ替え
- 優先順位リストの管理
- フォーム内の動的リスト項目

## 必要なパッケージ

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 必要なインポート

```tsx
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
```

## 型定義

```tsx
interface FormItem {
  id: string;      // 一意のID（必須）
  name: string;    // 表示名
  order: number;   // 順序
}
```

## SortableItemコンポーネント

ドラッグハンドル付きの並べ替え可能アイテム。

```tsx
import { GripVertical, X } from "lucide-react";

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
      {/* ドラッグハンドル */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 順序番号 */}
      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>

      {/* 入力フィールド */}
      <input
        type="text"
        value={item.name}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="アイテム名"
      />

      {/* 削除ボタン */}
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
```

## センサー設定

ポインター（マウス/タッチ）とキーボード操作に対応。

```tsx
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

## handleDragEnd関数

ドラッグ完了時に配列を並べ替え、orderを更新。

```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    setFormData((prev) => {
      const oldIndex = prev.items.findIndex((item) => item.id === active.id);
      const newIndex = prev.items.findIndex((item) => item.id === over.id);

      // arrayMoveで並べ替え、orderを再設定
      const newItems = arrayMove(prev.items, oldIndex, newIndex).map(
        (item, idx) => ({
          ...item,
          order: idx,
        })
      );

      return { ...prev, items: newItems };
    });
  }
};
```

## DndContext + SortableContext の使用

```tsx
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
```

## アイテム操作関数

```tsx
// アイテム追加
const addItem = () => {
  setFormData((prev) => ({
    ...prev,
    items: [
      ...prev.items,
      {
        id: `item-${Date.now()}-${prev.items.length}`,
        name: "",
        order: prev.items.length,
      },
    ],
  }));
};

// アイテム削除（order再設定）
const removeItem = (itemId: string) => {
  if (formData.items.length <= 1) return;
  setFormData((prev) => ({
    ...prev,
    items: prev.items
      .filter((item) => item.id !== itemId)
      .map((item, i) => ({ ...item, order: i })),
  }));
};

// アイテム更新
const updateItem = (itemId: string, value: string) => {
  setFormData((prev) => ({
    ...prev,
    items: prev.items.map((item) =>
      item.id === itemId ? { ...item, name: value } : item
    ),
  }));
};
```

## 注意点

1. **一意のID**: 各アイテムには必ず一意のIDが必要。`Date.now()` + index で生成推奨
2. **touch-none**: ドラッグハンドルには `touch-none` クラスを付与（スクロールとの競合防止）
3. **cursor-grab**: ドラッグ可能であることを視覚的に示す
4. **order再設定**: 並べ替え・削除後は必ず全アイテムのorderを再設定
5. **最低1件保証**: `canRemove` で最後の1件は削除不可にする

## 実装例

[crm-app/src/app/(dashboard)/settings/templates/page.tsx](../../src/app/(dashboard)/settings/templates/page.tsx) に完全な実装例あり。
