"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowDownLeft,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  History,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { WebhookReceiveForm } from "./WebhookReceiveForm";
import { WebhookLogViewer } from "./WebhookLogViewer";

interface WebhookReceive {
  id: string;
  name: string;
  webhookId: string;
  isActive: boolean;
  workflow: unknown;
  createdAt: string;
  _count?: {
    logs: number;
  };
}

export function WebhookReceiveManager() {
  const [webhooks, setWebhooks] = useState<WebhookReceive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookReceive | null>(null);
  const [viewingLogsId, setViewingLogsId] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/webhooks/receive");
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      const data = await res.json();
      setWebhooks(data);
    } catch {
      setError("Webhookの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCopyId = async (webhookId: string) => {
    await navigator.clipboard.writeText(webhookId);
    setCopiedId(webhookId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (webhook: WebhookReceive) => {
    try {
      const res = await fetch(`/api/webhooks/receive/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      fetchWebhooks();
    } catch {
      setError("Webhookの更新に失敗しました");
    }
  };

  const handleDelete = async (webhook: WebhookReceive) => {
    if (!confirm(`「${webhook.name}」を削除しますか？関連するログも削除されます。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/webhooks/receive/${webhook.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete webhook");
      fetchWebhooks();
    } catch {
      setError("Webhookの削除に失敗しました");
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingWebhook(null);
  };

  const handleFormSave = () => {
    handleFormClose();
    fetchWebhooks();
  };

  const handleEdit = (webhook: WebhookReceive) => {
    setEditingWebhook(webhook);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (viewingLogsId) {
    const webhook = webhooks.find((w) => w.id === viewingLogsId);
    return (
      <WebhookLogViewer
        webhookId={viewingLogsId}
        webhookName={webhook?.name || ""}
        onBack={() => setViewingLogsId(null)}
      />
    );
  }

  if (showForm) {
    return (
      <WebhookReceiveForm
        webhook={editingWebhook}
        onSave={handleFormSave}
        onCancel={handleFormClose}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:underline"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          外部サービスからデータを受信してワークフローを実行します
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Webhookを追加
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ArrowDownLeft className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            受信Webhookがありません
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            最初のWebhookを作成
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <ArrowDownLeft className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">{webhook.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                      onClick={() => handleCopyId(webhook.webhookId)}
                      className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-muted/80"
                    >
                      <code>{webhook.webhookId}</code>
                      {copiedId === webhook.webhookId ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {webhook._count && (
                      <span className="text-xs">
                        ログ: {webhook._count.logs}件
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingLogsId(webhook.id)}
                  className="rounded-md border px-2 py-1.5 text-sm hover:bg-muted"
                  title="ログを見る"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(webhook)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                    webhook.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {webhook.isActive ? (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      有効
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      無効
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleEdit(webhook)}
                  className="rounded-md border px-2 py-1.5 text-sm hover:bg-muted"
                  title="編集"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(webhook)}
                  className="rounded-md border px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  title="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
