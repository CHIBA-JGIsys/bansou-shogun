"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileJson,
} from "lucide-react";

interface WebhookLog {
  id: string;
  receivedData: Record<string, unknown>;
  receivedAt: string;
}

interface Props {
  webhookId: string;
  webhookName: string;
  onBack: () => void;
}

export function WebhookLogViewer({ webhookId, webhookName, onBack }: Props) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/webhooks/receive/${webhookId}/logs?limit=${pagination.limit}&offset=${pagination.offset}`
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, [webhookId, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-md p-1 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="font-semibold">{webhookName}</h3>
            <p className="text-sm text-muted-foreground">受信ログ</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          更新
        </button>
      </div>

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <FileJson className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            受信ログがありません
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <div className="border-b bg-muted/50 px-4 py-2">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <span className="w-8"></span>
                <span className="flex-1">受信日時</span>
                <span className="w-32 text-right">データサイズ</span>
              </div>
            </div>
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id}>
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex w-full items-center px-4 py-3 text-left hover:bg-muted/30"
                  >
                    <span className="w-8">
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex flex-1 items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDate(log.receivedAt)}
                    </span>
                    <span className="w-32 text-right text-sm text-muted-foreground">
                      {JSON.stringify(log.receivedData).length} bytes
                    </span>
                  </button>
                  {expandedLogs.has(log.id) && (
                    <div className="border-t bg-muted/20 px-4 py-3">
                      <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                        {JSON.stringify(log.receivedData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {pagination.offset + 1} -{" "}
              {Math.min(pagination.offset + logs.length, pagination.total)} /{" "}
              {pagination.total} 件
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    offset: Math.max(0, p.offset - p.limit),
                  }))
                }
                disabled={pagination.offset === 0}
                className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
              >
                前へ
              </button>
              <button
                onClick={() =>
                  setPagination((p) => ({
                    ...p,
                    offset: p.offset + p.limit,
                  }))
                }
                disabled={!pagination.hasMore}
                className="rounded-md border px-3 py-1 hover:bg-muted disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
