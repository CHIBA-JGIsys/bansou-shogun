"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

// Types
interface Task {
  id: string;
  name: string;
  dueDate: string;
  daysPastDue: number;
  assigneeName?: string;
  dealName?: string;
  productName?: string;
  taskType?: string;
}

interface TodayActionsProps {
  overdueTasks?: Task[];
  onTaskClick?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
}

// Task type labels
const taskTypeLabels: Record<string, string> = {
  ESTIMATE: "見積作成",
  CONTRACT: "契約書作成",
  INVOICE: "請求書発行",
  DELIVERY: "納品対応",
  OTHER: "その他",
};

export function TodayActions({
  overdueTasks = [],
  onTaskClick,
  onTaskComplete,
}: TodayActionsProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" />
            本日のアクション
          </h2>
          {overdueTasks.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              <AlertTriangle className="mr-1 h-4 w-4" />
              {overdueTasks.length}件の期限超過
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">
          対応期日を過ぎている未完了タスク
        </p>

        {overdueTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-green-500" />
            <p className="text-green-600 font-medium">期限超過タスクはありません</p>
            <p className="text-sm mt-1">素晴らしい！順調に進んでいます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 hover:bg-red-100/50 cursor-pointer transition-colors"
                onClick={() => onTaskClick?.(task.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {task.name}
                    </span>
                    {task.taskType && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {taskTypeLabels[task.taskType] || task.taskType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {(task.dealName || task.productName) && (
                      <p className="text-sm text-muted-foreground truncate">
                        {task.dealName}
                        {task.productName && ` / ${task.productName}`}
                      </p>
                    )}
                    {task.assigneeName && (
                      <span className="text-xs text-muted-foreground">
                        担当: {task.assigneeName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <span className="text-sm font-medium text-red-600">
                      {task.daysPastDue}日超過
                    </span>
                    <p className="text-xs text-muted-foreground">
                      期限: {task.dueDate}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete?.(task.id);
                    }}
                    className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    完了
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
