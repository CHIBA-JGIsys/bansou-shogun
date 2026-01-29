"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  PlusCircle,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";

interface WorkflowAction {
  type: "find" | "update" | "create";
  entity: "CUSTOMER" | "DEAL" | "PRODUCT" | "TASK";
  searchField?: string;
  searchKey?: string;
  recordIdKey?: string;
  mapping?: Record<string, string>;
}

interface Workflow {
  actions: WorkflowAction[];
}

interface WebhookReceive {
  id: string;
  name: string;
  webhookId: string;
  isActive: boolean;
  workflow: unknown;
  createdAt: string;
}

interface Props {
  webhook: WebhookReceive | null;
  onSave: () => void;
  onCancel: () => void;
}

const ENTITY_OPTIONS = [
  { value: "CUSTOMER", label: "顧客" },
  { value: "DEAL", label: "案件" },
  { value: "PRODUCT", label: "商材" },
  { value: "TASK", label: "タスク" },
];

const ACTION_TYPES = [
  { value: "find", label: "データを探す", icon: Search },
  { value: "update", label: "データを更新", icon: RefreshCw },
  { value: "create", label: "データを作成", icon: PlusCircle },
];

const FIELD_OPTIONS: Record<string, { value: string; label: string }[]> = {
  CUSTOMER: [
    { value: "id", label: "ID" },
    { value: "clientNo", label: "クライアントNO" },
    { value: "name", label: "クライアント名" },
    { value: "email", label: "メールアドレス" },
    { value: "googleDriveUrl", label: "Google Drive URL" },
    { value: "notes", label: "備考" },
  ],
  DEAL: [
    { value: "id", label: "ID" },
    { value: "name", label: "案件名" },
    { value: "notes", label: "備考" },
  ],
  PRODUCT: [
    { value: "id", label: "ID" },
    { value: "name", label: "商材名" },
    { value: "expectedAmount", label: "見込み金額" },
    { value: "confirmedAmount", label: "確定金額" },
  ],
  TASK: [
    { value: "id", label: "ID" },
    { value: "name", label: "タスク名" },
    { value: "detail", label: "詳細" },
    { value: "fileUrl", label: "ファイルURL" },
  ],
};

export function WebhookReceiveForm({ webhook, onSave, onCancel }: Props) {
  const [name, setName] = useState(webhook?.name || "");
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);
  const [actions, setActions] = useState<WorkflowAction[]>(() => {
    const wf = webhook?.workflow as Workflow | null;
    return wf?.actions || [];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        type: "find",
        entity: "CUSTOMER",
        searchField: "",
        searchKey: "",
        mapping: {},
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleActionChange = (
    index: number,
    field: keyof WorkflowAction,
    value: unknown
  ) => {
    setActions(
      actions.map((action, i) => {
        if (i !== index) return action;
        return { ...action, [field]: value };
      })
    );
  };

  const handleMappingChange = (
    actionIndex: number,
    sourceKey: string,
    targetField: string
  ) => {
    setActions(
      actions.map((action, i) => {
        if (i !== actionIndex) return action;
        const newMapping = { ...action.mapping };
        if (targetField) {
          newMapping[sourceKey] = targetField;
        } else {
          delete newMapping[sourceKey];
        }
        return { ...action, mapping: newMapping };
      })
    );
  };

  const handleAddMapping = (actionIndex: number) => {
    const key = `key_${Object.keys(actions[actionIndex].mapping || {}).length + 1}`;
    handleMappingChange(actionIndex, key, "");
  };

  const handleRemoveMapping = (actionIndex: number, sourceKey: string) => {
    setActions(
      actions.map((action, i) => {
        if (i !== actionIndex) return action;
        const newMapping = { ...action.mapping };
        delete newMapping[sourceKey];
        return { ...action, mapping: newMapping };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Webhook名を入力してください");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = webhook
        ? `/api/webhooks/receive/${webhook.id}`
        : "/api/webhooks/receive";
      const method = webhook ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          isActive,
          workflow: { actions },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save webhook");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="rounded-md p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {webhook ? "Webhookを編集" : "新しいWebhookを作成"}
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本設定 */}
        <div className="space-y-4">
          <h4 className="font-medium">基本設定</h4>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Webhook名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: Googleドライブフォルダ作成完了"
                className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {webhook && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Webhook ID
                </label>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                  <code>{webhook.webhookId}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  このIDをリクエストボディの webhook_id に含めてください
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm">
                有効にする
              </label>
            </div>
          </div>
        </div>

        {/* ワークフローアクション */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">ワークフローアクション</h4>
            <button
              type="button"
              onClick={handleAddAction}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              アクションを追加
            </button>
          </div>

          {actions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Zap className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                ワークフローアクションがありません
              </p>
              <button
                type="button"
                onClick={handleAddAction}
                className="mt-2 text-sm text-primary hover:underline"
              >
                最初のアクションを追加
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      アクション {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {/* アクションタイプ */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          アクションタイプ
                        </label>
                        <select
                          value={action.type}
                          onChange={(e) =>
                            handleActionChange(
                              index,
                              "type",
                              e.target.value as WorkflowAction["type"]
                            )
                          }
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          {ACTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          対象DB
                        </label>
                        <select
                          value={action.entity}
                          onChange={(e) =>
                            handleActionChange(
                              index,
                              "entity",
                              e.target.value as WorkflowAction["entity"]
                            )
                          }
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        >
                          {ENTITY_OPTIONS.map((entity) => (
                            <option key={entity.value} value={entity.value}>
                              {entity.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 検索設定（findの場合） */}
                    {action.type === "find" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            検索フィールド
                          </label>
                          <select
                            value={action.searchField || ""}
                            onChange={(e) =>
                              handleActionChange(
                                index,
                                "searchField",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border px-3 py-2 text-sm"
                          >
                            <option value="">選択してください</option>
                            {FIELD_OPTIONS[action.entity]?.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted-foreground">
                            検索値キー（受信データ）
                          </label>
                          <input
                            type="text"
                            value={action.searchKey || ""}
                            onChange={(e) =>
                              handleActionChange(
                                index,
                                "searchKey",
                                e.target.value
                              )
                            }
                            placeholder="例: recordId"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* レコードIDキー（updateの場合） */}
                    {action.type === "update" && (
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          レコードIDキー（受信データ）
                        </label>
                        <input
                          type="text"
                          value={action.recordIdKey || ""}
                          onChange={(e) =>
                            handleActionChange(
                              index,
                              "recordIdKey",
                              e.target.value
                            )
                          }
                          placeholder="例: recordId"
                          className="w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                    )}

                    {/* マッピング設定（update/createの場合） */}
                    {(action.type === "update" || action.type === "create") && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-xs text-muted-foreground">
                            フィールドマッピング
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddMapping(index)}
                            className="text-xs text-primary hover:underline"
                          >
                            + マッピング追加
                          </button>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(action.mapping || {}).map(
                            ([sourceKey, targetField]) => (
                              <div
                                key={sourceKey}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={sourceKey}
                                  onChange={(e) => {
                                    const newMapping = { ...action.mapping };
                                    delete newMapping[sourceKey];
                                    newMapping[e.target.value] = targetField;
                                    handleActionChange(
                                      index,
                                      "mapping",
                                      newMapping
                                    );
                                  }}
                                  placeholder="受信キー"
                                  className="flex-1 rounded-md border px-2 py-1 text-sm"
                                />
                                <span className="text-muted-foreground">→</span>
                                <select
                                  value={targetField}
                                  onChange={(e) =>
                                    handleMappingChange(
                                      index,
                                      sourceKey,
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 rounded-md border px-2 py-1 text-sm"
                                >
                                  <option value="">フィールド選択</option>
                                  {FIELD_OPTIONS[action.entity]?.map((field) => (
                                    <option key={field.value} value={field.value}>
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMapping(index, sourceKey)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          )}
                          {Object.keys(action.mapping || {}).length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              マッピングがありません
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {webhook ? "保存" : "作成"}
          </button>
        </div>
      </form>
    </div>
  );
}
