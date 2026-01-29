"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Star,
  Building2,
  Filter,
} from "lucide-react";
import { KanbanBoard, ColumnConfig } from "@/components/kanban";
import { PageHeader, ViewToggle } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { useDebounce } from "@/hooks/useDebounce";

type Deal = {
  id: string;
  name: string;
  dealType: string | null;
  progress: string;
  isImportant: boolean;
  occurredDate: string | null;
  lastContactDate: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    clientNo: string;
  };
  salesRep: {
    id: string;
    name: string;
  } | null;
  _count: {
    products: number;
    tasks: number;
  };
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// カンバンビュー用のカラム設定
const kanbanColumns: ColumnConfig[] = [
  { id: "LEAD", title: "リード", color: "#9ca3af" },
  { id: "FIRST_MEETING", title: "初回面談", color: "#3b82f6" },
  { id: "WAITING_DETAILS", title: "明細待ち", color: "#eab308" },
  { id: "DETAILS_OBTAINED", title: "明細取得済み", color: "#22c55e" },
];

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [progressFilter, setProgressFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (progressFilter) params.set("progress", progressFilter);

      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();

      if (data.success) {
        setDeals(data.data);
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, progressFilter, sortBy, sortOrder]);

  // デバウンスされた検索が変わったらページを1に戻す
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // カンバンビューでカードを移動した時の処理
  const handleItemMove = useCallback(async (itemId: string, newColumnId: string) => {
    // 楽観的更新: UI上で先に反映
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === itemId ? { ...deal, progress: newColumnId } : deal
      )
    );

    // API呼び出しで進捗を更新
    try {
      const res = await fetch(`/api/deals/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: newColumnId }),
      });

      if (!res.ok) {
        // 失敗時はデータを再取得
        console.error("Failed to update deal progress");
        fetchDeals();
      }
    } catch (error) {
      console.error("Error updating deal progress:", error);
      fetchDeals();
    }
  }, [fetchDeals]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="案件管理"
        description="案件の一覧表示・管理を行います"
        actions={
          <>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            <Link
              href="/deals/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新規作成</span>
              <span className="sm:hidden">追加</span>
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="案件名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Progress Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={progressFilter}
            onChange={(e) => {
              setProgressFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border bg-background py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">全ての進捗</option>
            <option value="LEAD">リード</option>
            <option value="FIRST_MEETING">初回面談</option>
            <option value="WAITING_DETAILS">明細待ち</option>
            <option value="DETAILS_OBTAINED">明細取得済み</option>
          </select>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div>
          {/* Sort Controls */}
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">並び替え:</span>
            <button
              onClick={() => handleSort("name")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted ${
                sortBy === "name" ? "bg-muted font-medium" : ""
              }`}
            >
              案件名
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("createdAt")}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted ${
                sortBy === "createdAt" ? "bg-muted font-medium" : ""
              }`}
            >
              作成日
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
          ) : (
            <ResponsiveTable
              data={deals}
              columns={[
                {
                  key: "name" as keyof Deal,
                  header: "案件名",
                  render: (deal) => (
                    <div className="flex items-center gap-2">
                      {deal.isImportant && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{deal.name}</div>
                        {deal.dealType && (
                          <span className="text-xs text-muted-foreground">
                            {dealTypeLabels[deal.dealType]}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "customer" as keyof Deal,
                  header: "顧客",
                  render: (deal) => (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-sm">{deal.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{deal.customer.clientNo}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "progress" as keyof Deal,
                  header: "進捗",
                  render: (deal) => (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        progressLabels[deal.progress]?.color || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {progressLabels[deal.progress]?.label || deal.progress}
                    </span>
                  ),
                },
                {
                  key: "salesRep" as keyof Deal,
                  header: "担当者",
                  render: (deal) => <span className="text-sm">{deal.salesRep?.name || "-"}</span>,
                },
                {
                  key: "_count" as keyof Deal,
                  header: "商材",
                  render: (deal) => <span className="text-sm">{deal._count.products}件</span>,
                },
                {
                  key: "createdAt" as keyof Deal,
                  header: "作成日",
                  render: (deal) => (
                    <span className="text-sm text-muted-foreground">{formatDate(deal.createdAt)}</span>
                  ),
                },
              ]}
              primaryField="name"
              onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
              emptyMessage="案件が見つかりません"
            />
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="min-h-[400px] overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : deals.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              案件が見つかりません
            </div>
          ) : (
            <KanbanBoard
              columns={kanbanColumns}
              items={deals}
              getItemColumn={(deal) => deal.progress}
              onItemMove={handleItemMove}
              renderCard={(deal) => (
                <div
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {deal.isImportant && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                    <span className="font-medium text-sm truncate">{deal.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{deal.customer.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{deal.salesRep?.name || "-"}</span>
                    <span>{deal._count.products}商材</span>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Pagination (List View Only) */}
      {viewMode === "list" && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全{meta.total}件中 {(meta.page - 1) * meta.limit + 1}-
            {Math.min(meta.page * meta.limit, meta.total)}件を表示
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border p-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
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
