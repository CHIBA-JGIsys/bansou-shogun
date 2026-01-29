"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Calendar,
  User,
  ArrowUpDown,
} from "lucide-react";
import type { Task, TaskStatus, TaskType, User as UserType, Deal, Product } from "@prisma/client";
import { KanbanBoard, ColumnConfig } from "@/components/kanban";
import { PageHeader, ViewToggle } from "@/components/ui/page-header";
import { useDebounce } from "@/hooks/useDebounce";

type TaskWithRelations = Task & {
  assignee: Pick<UserType, "id" | "name" | "email"> | null;
  creator: Pick<UserType, "id" | "name" | "email"> | null;
  deal: Pick<Deal, "id" | "name"> | null;
  product: Pick<Product, "id" | "name"> | null;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
  TODO: { label: "未着手", color: "bg-gray-100 text-gray-700", icon: Circle },
  IN_PROGRESS: { label: "進行中", color: "bg-blue-100 text-blue-700", icon: Clock },
  COMPLETED: { label: "完了", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  ESTIMATE: "見積作成",
  CONTRACT: "契約書作成",
  INVOICE: "請求書発行",
  DELIVERY: "納品対応",
  OTHER: "その他",
};

// カンバンカラム構成
const KANBAN_COLUMNS: ColumnConfig[] = [
  { id: "TODO", title: "未着手", color: "#6b7280" },
  { id: "IN_PROGRESS", title: "進行中", color: "#3b82f6" },
  { id: "COMPLETED", title: "完了", color: "#22c55e" },
];

type ViewMode = "list" | "kanban";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // ビューモード
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // フィルター・検索
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks(data.data);
          setMeta(data.meta);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder]);

  // デバウンスされた検索が変わったらページを1に戻す
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ja-JP");
  };

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && statusFilter !== "COMPLETED";
  };

  // カンバンビューでのステータス更新（楽観的更新）
  const handleTaskMove = useCallback(async (taskId: string, newStatus: string) => {
    // 1. 楽観的更新: 即座にUI反映
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus as TaskStatus } : task
      )
    );

    // 2. API呼び出し
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // 3. 失敗時のロールバック
        console.error("Failed to update task status");
        fetchTasks();
      }
    } catch (error) {
      // 3. エラー時のロールバック
      console.error("Failed to update task status:", error);
      fetchTasks();
    }
  }, [fetchTasks]);

  // カンバンカードのレンダリング
  const renderTaskCard = (task: TaskWithRelations) => {
    return (
      <div
        onClick={() => router.push(`/tasks/${task.id}`)}
        className="cursor-pointer"
      >
        <div className="font-medium text-sm mb-1">{task.name}</div>
        {task.detail && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.detail}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mb-2">
          {task.taskType && (
            <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
              {TASK_TYPE_LABELS[task.taskType]}
            </span>
          )}
          {task.deal && (
            <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
              {task.deal.name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.assignee ? (
            <div className="flex items-center gap-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                {task.assignee.name?.charAt(0) || <User className="h-3 w-3" />}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">未割当</span>
          )}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue(task.dueDate) ? "text-red-600" : ""
              }`}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="タスク管理"
        description="タスクの作成・管理を行います"
        actions={
          <>
            <ViewToggle
              view={viewMode}
              onViewChange={setViewMode}
            />
            <button
              onClick={() => router.push("/tasks/new")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新規タスク</span>
              <span className="sm:hidden">新規</span>
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="タスク名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TaskStatus | "");
            setPage(1);
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">全てのステータス</option>
          {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Task View */}
      {loading ? (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          読み込み中...
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
          <p>タスクがありません</p>
          <button
            onClick={() => router.push("/tasks/new")}
            className="mt-2 text-primary hover:underline"
          >
            最初のタスクを作成
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban View */
        <KanbanBoard
          columns={KANBAN_COLUMNS}
          items={tasks}
          getItemColumn={(task) => task.status}
          onItemMove={handleTaskMove}
          renderCard={renderTaskCard}
        />
      ) : (
        /* List View */
        <div className="rounded-md border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    タスク名
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  タイプ
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  担当者
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("dueDate")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    期限
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  関連
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const statusConfig = STATUS_CONFIG[task.status];
                const StatusIcon = statusConfig.icon;
                return (
                  <tr
                    key={task.id}
                    onClick={() => router.push(`/tasks/${task.id}`)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.name}</div>
                      {task.detail && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.detail}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {task.taskType ? TASK_TYPE_LABELS[task.taskType] : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {task.assignee.name?.charAt(0) || <User className="h-3 w-3" />}
                          </div>
                          <span className="text-sm">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">未割当</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          isOverdue(task.dueDate) ? "text-red-600" : "text-muted-foreground"
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {task.deal && (
                        <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 mr-1">
                          案件: {task.deal.name}
                        </span>
                      )}
                      {task.product && (
                        <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          商材: {task.product.name}
                        </span>
                      )}
                      {!task.deal && !task.product && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (List view only) */}
      {viewMode === "list" && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {meta.total} 件中 {(meta.page - 1) * meta.limit + 1} -{" "}
            {Math.min(meta.page * meta.limit, meta.total)} 件を表示
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="rounded-md border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
