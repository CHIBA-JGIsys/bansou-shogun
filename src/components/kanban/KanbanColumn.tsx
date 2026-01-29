'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  itemIds: string[];
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, itemIds, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`
        flex flex-col w-[280px] md:w-72 min-w-[280px] md:min-w-72 rounded-lg bg-muted/50 shrink-0
        ${isOver ? 'ring-2 ring-primary/50' : ''}
      `}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-medium text-sm">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {itemIds.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </div>
    </div>
  );
}
