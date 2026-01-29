"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  Trash2,
  PlayCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WebhookSendForm,
  WebhookFormData,
} from "@/components/settings/webhooks/WebhookSendForm";
import { WebhookTestDialog } from "@/components/settings/webhooks/WebhookTestDialog";
import { WebhookReceiveManager } from "@/components/settings/webhook";

interface WebhookSend {
  id: string;
  name: string;
  buttonName: string;
  url: string;
  entity: "CUSTOMER" | "DEAL" | "PRODUCT" | "TASK";
  fields: string[];
  includeParent: boolean;
  buttonLocation: "DETAIL" | "LIST";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


interface FieldDefinition {
  id: string;
  entityType: string;
  fieldName: string;
  fieldLabel: string;
}

const entityLabels: Record<string, string> = {
  CUSTOMER: "顧客",
  DEAL: "案件",
  PRODUCT: "商材",
  TASK: "タスク",
};

export default function AutomationSettingsPage() {
  const [sendWebhooks, setSendWebhooks] = useState<WebhookSend[]>([]);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookFormData | null>(
    null
  );
  const [testDialogWebhook, setTestDialogWebhook] = useState<WebhookSend | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // データ取得
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [webhooksRes, fieldsRes] = await Promise.all([
        fetch("/api/webhooks/send"),
        fetch("/api/fields"),
      ]);

      if (webhooksRes.ok) {
        const data = await webhooksRes.json();
        setSendWebhooks(data);
      }

      if (fieldsRes.ok) {
        const data = await fieldsRes.json();
        setFields(data);
      }

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フィールドオプションに変換
  const fieldOptions = fields.map((f) => ({
    value: f.fieldName,
    label: f.fieldLabel,
    entity: f.entityType,
  }));

  // Webhook作成/更新
  const handleSubmit = async (data: WebhookFormData) => {
    if (data.id) {
      // 更新
      const response = await fetch(`/api/webhooks/send/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "更新に失敗しました");
      }
    } else {
      // 作成
      const response = await fetch("/api/webhooks/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "作成に失敗しました");
      }
    }

    await fetchData();
  };

  // Webhook削除
  const handleDelete = async (id: string) => {
    if (!confirm("このWebhookを削除しますか？")) return;

    try {
      const response = await fetch(`/api/webhooks/send/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  // 有効/無効切り替え
  const handleToggleActive = async (webhook: WebhookSend) => {
    setTogglingId(webhook.id);
    try {
      const response = await fetch(`/api/webhooks/send/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });

      if (response.ok) {
        setSendWebhooks((prev) =>
          prev.map((w) =>
            w.id === webhook.id ? { ...w, isActive: !w.isActive } : w
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
    } finally {
      setTogglingId(null);
    }
  };

  // 編集モードで開く
  const handleEdit = (webhook: WebhookSend) => {
    setEditingWebhook({
      id: webhook.id,
      name: webhook.name,
      buttonName: webhook.buttonName,
      url: webhook.url,
      entity: webhook.entity,
      fields: webhook.fields,
      includeParent: webhook.includeParent,
      buttonLocation: webhook.buttonLocation,
      isActive: webhook.isActive,
    });
    setIsFormOpen(true);
  };

  // 新規作成モードで開く
  const handleAdd = () => {
    setEditingWebhook(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">自動化</h2>
        <p className="text-sm text-muted-foreground">
          Webhook連携で外部サービスと自動連携します
        </p>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            送信Webhook
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            受信Webhook
          </TabsTrigger>
        </TabsList>

        {/* 送信Webhook */}
        <TabsContent value="send" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              ボタンクリックで外部サービスにデータを送信します
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Webhookを追加
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sendWebhooks.length > 0 ? (
            <div className="space-y-3">
              {sendWebhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-lg border p-4"
                >
                  {/* ヘッダー部分 */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                        <ArrowUpRight className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{webhook.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {entityLabels[webhook.entity]}
                          </span>
                          <span className="truncate">ボタン: {webhook.buttonName}</span>
                        </div>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* テスト送信ボタン */}
                      <button
                        onClick={() => setTestDialogWebhook(webhook)}
                        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                        title="テスト送信"
                      >
                        <PlayCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">テスト</span>
                      </button>

                      {/* 有効/無効トグル */}
                      <button
                        onClick={() => handleToggleActive(webhook)}
                        disabled={togglingId === webhook.id}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
                          webhook.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {togglingId === webhook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : webhook.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {webhook.isActive ? "有効" : "無効"}
                      </button>

                      {/* 編集ボタン */}
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        編集
                      </button>

                      {/* 削除ボタン */}
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="rounded-md border border-red-200 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                送信Webhookがまだ設定されていません
              </p>
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                最初のWebhookを追加
              </button>
            </div>
          )}
        </TabsContent>

        {/* 受信Webhook */}
        <TabsContent value="receive" className="mt-6 space-y-4">
          <WebhookReceiveManager />

          {/* Webhook URL Info */}
          <div className="rounded-lg border border-dashed bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Webhook URL</h4>
                <p className="text-sm text-muted-foreground">
                  受信用WebhookのURLは以下の形式です：
                </p>
                <code className="mt-2 block rounded bg-muted px-3 py-2 text-sm">
                  https://[your-domain]/api/functions/receiveWebhook
                </code>
                <p className="mt-2 text-xs text-muted-foreground">
                  リクエストボディに <code>webhook_id</code> を含めてください
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Documentation Link */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="h-4 w-4" />
        <a href="#" className="hover:text-primary hover:underline">
          Webhook連携のドキュメントを見る
        </a>
      </div>

      {/* Webhook Form Modal */}
      <WebhookSendForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingWebhook(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingWebhook}
        fields={fieldOptions}
      />

      {/* Test Dialog */}
      {testDialogWebhook && (
        <WebhookTestDialog
          isOpen={!!testDialogWebhook}
          onClose={() => setTestDialogWebhook(null)}
          webhookId={testDialogWebhook.id}
          webhookName={testDialogWebhook.name}
          entity={testDialogWebhook.entity}
        />
      )}
    </div>
  );
}
