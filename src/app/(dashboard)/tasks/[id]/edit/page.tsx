"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Task, User, Deal, Product } from "@prisma/client";
import { PageHeader } from "@/components/ui/page-header";

type UserOption = Pick<User, "id" | "name" | "email">;
type DealOption = Pick<Deal, "id" | "name">;
type ProductOption = Pick<Product, "id" | "name">;

const TASK_STATUS_OPTIONS = [
  { value: "TODO", label: "未着手" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "COMPLETED", label: "完了" },
];

const TASK_TYPE_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "ESTIMATE", label: "見積作成" },
  { value: "CONTRACT", label: "契約書作成" },
  { value: "INVOICE", label: "請求書発行" },
  { value: "DELIVERY", label: "納品対応" },
  { value: "OTHER", label: "その他" },
];

const BINDING_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "DEAL", label: "案件" },
  { value: "PRODUCT", label: "商材" },
  { value: "STANDALONE", label: "単体" },
];

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options for selects
  const [users, setUsers] = useState<UserOption[]>([]);
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState("TODO");
  const [taskType, setTaskType] = useState("");
  const [binding, setBinding] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [dealId, setDealId] = useState("");
  const [productId, setProductId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  // Fetch task and options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task
        const taskRes = await fetch(`/api/tasks/${id}`);
        if (taskRes.ok) {
          const data = await taskRes.json();
          if (data.success) {
            const task: Task = data.data;
            setName(task.name);
            setDetail(task.detail || "");
            setStatus(task.status);
            setTaskType(task.taskType || "");
            setBinding(task.binding || "");
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
            setFileUrl(task.fileUrl || "");
            setDealId(task.dealId || "");
            setProductId(task.productId || "");
            setAssigneeId(task.assigneeId || "");
          }
        }

        // Fetch users
        const usersRes = await fetch("/api/users?limit=100");
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (data.success) setUsers(data.data);
        }

        // Fetch deals
        const dealsRes = await fetch("/api/deals?limit=100");
        if (dealsRes.ok) {
          const data = await dealsRes.json();
          if (data.success) setDeals(data.data);
        }

        // Fetch products
        const productsRes = await fetch("/api/products?limit=100");
        if (productsRes.ok) {
          const data = await productsRes.json();
          if (data.success) setProducts(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("タスク名は必須です");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          detail: detail.trim() || null,
          status,
          taskType: taskType || null,
          binding: binding || null,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          fileUrl: fileUrl.trim() || null,
          dealId: dealId || null,
          productId: productId || null,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "タスクの更新に失敗しました");
      }

      router.push(`/tasks/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "タスクの更新に失敗しました");
    } finally {
      setSaving(false);
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
      <PageHeader
        title="タスク編集"
        description="タスクを編集します"
        backHref={`/tasks/${id}`}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-red-600 text-sm">{error}</div>
        )}

        <div className="rounded-lg border bg-card p-6 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タスク名を入力"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="block text-sm font-medium mb-1">詳細</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="タスクの詳細を入力"
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-sm font-medium mb-1">タイプ</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium mb-1">期限</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium mb-1">担当者</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">未割当</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File URL */}
          <div>
            <label className="block text-sm font-medium mb-1">ファイルURL</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Relations */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">関連付け（任意）</h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Binding */}
            <div>
              <label className="block text-sm font-medium mb-1">紐づき先</label>
              <select
                value={binding}
                onChange={(e) => setBinding(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {BINDING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deal */}
            <div>
              <label className="block text-sm font-medium mb-1">関連案件</label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">なし</option>
                {deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium mb-1">関連商材</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">なし</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link
            href={`/tasks/${id}`}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "更新中..." : "更新"}
          </button>
        </div>
      </form>
    </div>
  );
}
