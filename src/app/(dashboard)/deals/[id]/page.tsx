"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Star,
  Building2,
  User,
  Calendar,
  Package,
  CheckSquare,
  Clock,
  FileText,
  Plus,
  List,
  LayoutGrid,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard, ColumnConfig } from "@/components/kanban";
import { PageHeader } from "@/components/ui/page-header";

type Deal = {
  id: string;
  name: string;
  dealType: string | null;
  progress: string;
  isImportant: boolean;
  occurredDate: string | null;
  lastContactDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    clientNo: string;
    email: string | null;
  };
  salesRep: {
    id: string;
    name: string;
    email: string;
  } | null;
  officeRep: {
    id: string;
    name: string;
    email: string;
  } | null;
  products: Array<{
    id: string;
    name: string;
    productType: string;
    progress: string;
    probability: string | null;
    expectedAmount: number | null;
    confirmedAmount: number | null;
    monthlyAmount: number | null;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    taskType: string | null;
    dueDate: string | null;
    completedAt: string | null;
    assignee: { id: string; name: string } | null;
  }>;
};

const progressLabels: Record<string, { label: string; color: string }> = {
  LEAD: { label: "リード", color: "bg-gray-100 text-gray-700" },
  FIRST_MEETING: { label: "初回面談", color: "bg-blue-100 text-blue-700" },
  WAITING_DETAILS: { label: "明細待ち", color: "bg-yellow-100 text-yellow-700" },
  DETAILS_OBTAINED: { label: "明細取得済み", color: "bg-green-100 text-green-700" },
};

const dealTypeLabels: Record<string, string> = {
  NEW: "新規",
  EXISTING: "既存",
  REFERRAL: "紹介",
};

const productTypeLabels: Record<string, string> = {
  SPOT: "単発",
  STOCK: "ストック",
};

const productProgressLabels: Record<string, { label: string; color: string }> = {
  NEGOTIATION: { label: "交渉", color: "bg-gray-100 text-gray-700" },
  PROPOSAL: { label: "提案", color: "bg-blue-100 text-blue-700" },
  VERBAL_AGREEMENT: { label: "口頭承諾", color: "bg-yellow-100 text-yellow-700" },
  CONTRACT: { label: "契約", color: "bg-green-100 text-green-700" },
};

const taskStatusLabels: Record<string, { label: string; color: string }> = {
  TODO: { label: "未着手", color: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "進行中", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "完了", color: "bg-green-100 text-green-700" },
};

const taskKanbanColumns: ColumnConfig[] = [
  { id: "TODO", title: "未着手", color: "gray" },
  { id: "IN_PROGRESS", title: "進行中", color: "blue" },
  { id: "COMPLETED", title: "完了", color: "green" },
];

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("list");

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/${id}`);
        const data = await res.json();
        if (data.success) {
          setDeal(data.data);
        } else {
          router.push("/deals");
        }
      } catch (error) {
        console.error("Failed to fetch deal:", error);
        router.push("/deals");
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("この案件を削除してもよろしいですか？")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/deals");
      } else {
        alert("削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete deal:", error);
      alert("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    if (!deal) return;

    const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
    setUpdatingTaskId(taskId);

    // Optimistic UI update
    setDeal({
      ...deal,
      tasks: deal.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null }
          : task
      ),
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback on failure
        setDeal({
          ...deal,
          tasks: deal.tasks.map((task) =>
            task.id === taskId ? { ...task, status: currentStatus } : task
          ),
        });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // Rollback on error
      setDeal({
        ...deal,
        tasks: deal.tasks.map((task) =>
          task.id === taskId ? { ...task, status: currentStatus } : task
        ),
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: string) => {
    if (!deal) return;

    const task = deal.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousStatus = task.status;

    // Optimistic UI update
    setDeal({
      ...deal,
      tasks: deal.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null }
          : t
      ),
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback on failure
        setDeal({
          ...deal,
          tasks: deal.tasks.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t
          ),
        });
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      // Rollback on error
      setDeal({
        ...deal,
        tasks: deal.tasks.map((t) =>
          t.id === taskId ? { ...t, status: previousStatus } : t
        ),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!deal) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2 flex-wrap">
            {deal.isImportant && (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 shrink-0" />
            )}
            <span>{deal.name}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                progressLabels[deal.progress]?.color || "bg-gray-100 text-gray-700"
              }`}
            >
              {progressLabels[deal.progress]?.label || deal.progress}
            </span>
          </span>
        }
        description={
          <span className="flex items-center gap-4 flex-wrap">
            {deal.dealType && <span>{dealTypeLabels[deal.dealType]}</span>}
            <span>作成: {formatDate(deal.createdAt)}</span>
          </span>
        }
        backHref="/deals"
        actions={
          <>
            <Link
              href={`/products/new?dealId=${id}`}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">商材作成</span>
            </Link>
            <Link
              href={`/tasks/new?dealId=${id}`}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">タスク作成</span>
            </Link>
            <Link
              href={`/deals/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">編集</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">削除</span>
            </button>
          </>
        }
      />

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            基本情報
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            商材 ({deal.products.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            タスク ({deal.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            活動履歴
          </TabsTrigger>
          </TabsList>
        </div>

        {/* 基本情報 */}
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 顧客情報 */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Building2 className="h-4 w-4" />
                顧客情報
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">顧客名</div>
                  <Link
                    href={`/customers/${deal.customer.id}`}
                    className="text-primary hover:underline"
                  >
                    {deal.customer.name}
                  </Link>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">顧客番号</div>
                  <div>{deal.customer.clientNo}</div>
                </div>
                {deal.customer.email && (
                  <div>
                    <div className="text-sm text-muted-foreground">メール</div>
                    <div>{deal.customer.email}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 担当者情報 */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                担当者
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">営業担当</div>
                  <div>{deal.salesRep?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">事務担当</div>
                  <div>{deal.officeRep?.name || "-"}</div>
                </div>
              </div>
            </div>

            {/* 日付情報 */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" />
                日付
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">発生日</div>
                  <div>{formatDate(deal.occurredDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">最終コンタクト日</div>
                  <div>{formatDate(deal.lastContactDate)}</div>
                </div>
              </div>
            </div>

            {/* 備考 */}
            {deal.notes && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 font-semibold">備考</h3>
                <p className="whitespace-pre-wrap text-sm">{deal.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 商材 */}
        <TabsContent value="products" className="mt-6">
          {deal.products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                商材がまだありません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deal.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="block rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {productTypeLabels[product.productType]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            productProgressLabels[product.progress]?.color
                          }`}
                        >
                          {productProgressLabels[product.progress]?.label}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {product.productType === "SPOT"
                          ? `見込: ${formatCurrency(product.expectedAmount)} / 確定: ${formatCurrency(product.confirmedAmount)}`
                          : `月額: ${formatCurrency(product.monthlyAmount)}`}
                      </div>
                    </div>
                    {product.probability && (
                      <span className="rounded bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                        確度{product.probability}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* タスク */}
        <TabsContent value="tasks" className="mt-6">
          {deal.tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                タスクがまだありません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ビュー切替ボタン */}
              <div className="flex justify-end">
                <div className="inline-flex rounded-md border">
                  <button
                    onClick={() => setTaskViewMode("list")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      taskViewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    } rounded-l-md`}
                  >
                    <List className="h-4 w-4" />
                    リスト
                  </button>
                  <button
                    onClick={() => setTaskViewMode("kanban")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      taskViewMode === "kanban"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    } rounded-r-md`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    カンバン
                  </button>
                </div>
              </div>

              {/* リストビュー */}
              {taskViewMode === "list" && (
                <div className="space-y-2">
                  {deal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskToggle(task.id, task.status);
                          }}
                          disabled={updatingTaskId === task.id}
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            task.status === "COMPLETED"
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 hover:border-green-500"
                          } ${updatingTaskId === task.id ? "opacity-50" : ""}`}
                        >
                          {task.status === "COMPLETED" && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <Link
                          href={`/tasks/${task.id}`}
                          className="flex items-center gap-3 hover:text-primary"
                        >
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              taskStatusLabels[task.status]?.color
                            }`}
                          >
                            {taskStatusLabels[task.status]?.label}
                          </span>
                          <span className={task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}>
                            {task.name}
                          </span>
                        </Link>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.assignee && <span>{task.assignee.name}</span>}
                        {task.dueDate && <span>期限: {formatDate(task.dueDate)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* カンバンビュー */}
              {taskViewMode === "kanban" && (
                <div className="overflow-x-auto">
                  <KanbanBoard
                  columns={taskKanbanColumns}
                  items={deal.tasks}
                  getItemColumn={(task) => task.status}
                  onItemMove={handleTaskMove}
                  renderCard={(task) => (
                    <Link href={`/tasks/${task.id}`} className="block">
                      <div className="space-y-2">
                        <div className={`font-medium ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                          {task.name}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {task.assignee && (
                            <span className="rounded bg-muted px-1.5 py-0.5">
                              {task.assignee.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="rounded bg-muted px-1.5 py-0.5">
                              期限: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* 活動履歴 */}
        <TabsContent value="history" className="mt-6">
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              活動履歴は今後実装予定です
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
