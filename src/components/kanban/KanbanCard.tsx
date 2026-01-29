'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface KanbanCardProps {
  id: string;
  children: React.ReactNode;
}

export function KanbanCard({ id, children }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:border-primary/50 hover:shadow-md transition-all
        ${isDragging ? 'ring-2 ring-primary/50' : ''}
      `}
    >
      {children}
    </div>
  );
}
