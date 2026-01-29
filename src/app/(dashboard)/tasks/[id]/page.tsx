"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  Calendar,
  User,
  FileText,
  Link as LinkIcon,
  Building2,
  Package,
} from "lucide-react";
import type { Task, TaskStatus, TaskType, TaskBinding, User as UserType, Deal, Product, Customer } from "@prisma/client";
import { PageHeader } from "@/components/ui/page-header";

type TaskWithRelations = Task & {
  assignee: Pick<UserType, "id" | "name" | "email" | "role"> | null;
  creator: Pick<UserType, "id" | "name" | "email" | "role"> | null;
  deal: (Pick<Deal, "id" | "name" | "progress"> & {
    customer: Pick<Customer, "id" | "name" | "clientNo"> | null;
  }) | null;
  product: Pick<Product, "id" | "name" | "productType" | "progress"> | null;
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  TODO: { label: "未着手", color: "text-gray-700", bgColor: "bg-gray-100", icon: Circle },
  IN_PROGRESS: { label: "進行中", color: "text-blue-700", bgColor: "bg-blue-100", icon: Clock },
  COMPLETED: { label: "完了", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle2 },
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  ESTIMATE: "見積作成",
  CONTRACT: "契約書作成",
  INVOICE: "請求書発行",
  DELIVERY: "納品対応",
  OTHER: "その他",
};

const BINDING_LABELS: Record<TaskBinding, string> = {
  DEAL: "案件",
  PRODUCT: "商材",
  STANDALONE: "単体",
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/tasks/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTask(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch task:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTask({ ...task, status: newStatus, completedAt: data.data.completedAt });
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/tasks");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ja-JP");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">タスクが見つかりません</div>
        <Link href="/tasks" className="text-primary hover:underline">
          タスク一覧に戻る
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={task.name}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
            {task.taskType && (
              <span className="text-sm text-muted-foreground">
                {TASK_TYPE_LABELS[task.taskType]}
              </span>
            )}
          </div>
        }
        backHref="/tasks"
        actions={
          <>
            <button
              onClick={() => router.push(`/tasks/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">編集</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">削除</span>
            </button>
          </>
        }
      />

      {/* Status Change */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">ステータス変更</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof STATUS_CONFIG[TaskStatus]][]).map(
            ([status, config]) => {
              const Icon = config.icon;
              const isActive = task.status === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`flex items-center gap-1 sm:gap-2 rounded-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? `${config.bgColor} ${config.color}`
                      : "border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {config.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">基本情報</h3>
          <dl className="space-y-4">
            {task.detail && (
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  詳細
                </dt>
                <dd className="mt-1 whitespace-pre-wrap">{task.detail}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                期限
              </dt>
              <dd className="mt-1">{formatDate(task.dueDate)}</dd>
            </div>
            {task.completedAt && (
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  完了日
                </dt>
                <dd className="mt-1">{formatDateTime(task.completedAt)}</dd>
              </div>
            )}
            {task.fileUrl && (
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  ファイルURL
                </dt>
                <dd className="mt-1">
                  <a
                    href={task.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {task.fileUrl}
                  </a>
                </dd>
              </div>
            )}
            {task.binding && (
              <div>
                <dt className="text-sm text-muted-foreground">紐づき</dt>
                <dd className="mt-1">{BINDING_LABELS[task.binding]}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Assignee & Relations */}
        <div className="space-y-6">
          {/* Assignee */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">担当者</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" />
                  担当
                </dt>
                <dd className="mt-1">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {task.assignee.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{task.assignee.name}</div>
                        <div className="text-sm text-muted-foreground">{task.assignee.email}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">未割当</span>
                  )}
                </dd>
              </div>
              {task.creator && (
                <div>
                  <dt className="text-sm text-muted-foreground">作成者</dt>
                  <dd className="mt-1">{task.creator.name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Related Deal/Product */}
          {(task.deal || task.product) && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">関連情報</h3>
              <dl className="space-y-4">
                {task.deal && (
                  <div>
                    <dt className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      関連案件
                    </dt>
                    <dd className="mt-1">
                      <Link
                        href={`/deals/${task.deal.id}`}
                        className="text-primary hover:underline"
                      >
                        {task.deal.name}
                      </Link>
                      {task.deal.customer && (
                        <div className="text-sm text-muted-foreground mt-1">
                          顧客:{" "}
                          <Link
                            href={`/customers/${task.deal.customer.id}`}
                            className="text-primary hover:underline"
                          >
                            {task.deal.customer.name}
                          </Link>
                          {" "}({task.deal.customer.clientNo})
                        </div>
                      )}
                    </dd>
                  </div>
                )}
                {task.product && (
                  <div>
                    <dt className="text-sm text-muted-foreground flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      関連商材
                    </dt>
                    <dd className="mt-1">
                      <Link
                        href={`/products/${task.product.id}`}
                        className="text-primary hover:underline"
                      >
                        {task.product.name}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div className="text-sm text-muted-foreground">
        作成日: {formatDateTime(task.createdAt)} / 更新日: {formatDateTime(task.updatedAt)}
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">タスクを削除</h3>
            <p className="text-muted-foreground mb-4">
              「{task.name}」を削除してもよろしいですか？
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
