'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

export interface ColumnConfig {
  id: string;
  title: string;
  color: string;
}

export interface KanbanBoardProps<T extends { id: string }> {
  columns: ColumnConfig[];
  items: T[];
  getItemColumn: (item: T) => string;
  onItemMove: (itemId: string, newColumnId: string) => void;
  renderCard: (item: T) => React.ReactNode;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getItemColumn,
  onItemMove,
  renderCard,
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by column
  const itemsByColumn = columns.reduce<Record<string, T[]>>((acc, column) => {
    acc[column.id] = items.filter((item) => getItemColumn(item) === column.id);
    return acc;
  }, {});

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // handleDragOver: ドラッグ中は視覚的フィードバックのみ
  // onItemMoveはhandleDragEndでのみ呼び出し、重複更新を防ぐ
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // ドラッグ中はDragOverlayによる視覚的フィードバックのみ
    // 状態更新はhandleDragEndで行う
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overId = over.id as string;
    const currentColumn = getItemColumn(activeItem);

    // Final column determination
    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      // カラムが変わった場合のみonItemMoveを呼び出す
      if (currentColumn !== overColumn.id) {
        onItemMove(activeItem.id, overColumn.id);
      }
      return;
    }

    const overItem = items.find((item) => item.id === overId);
    if (overItem) {
      const targetColumn = getItemColumn(overItem);
      // カラムが変わった場合のみonItemMoveを呼び出す
      if (currentColumn !== targetColumn) {
        onItemMove(activeItem.id, targetColumn);
      }
    }
  }, [items, columns, getItemColumn, onItemMove]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnItems = itemsByColumn[column.id] || [];
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              itemIds={columnItems.map((item) => item.id)}
            >
              {columnItems.map((item) => (
                <KanbanCard key={item.id} id={item.id}>
                  {renderCard(item)}
                </KanbanCard>
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rounded-lg border bg-card p-3 shadow-lg opacity-90">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
