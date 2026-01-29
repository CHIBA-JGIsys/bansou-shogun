"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";

interface WebhookSendFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WebhookFormData) => Promise<void>;
  initialData?: WebhookFormData | null;
  fields: FieldOption[];
}

export interface WebhookFormData {
  id?: string;
  name: string;
  buttonName: string;
  url: string;
  entity: "CUSTOMER" | "DEAL" | "PRODUCT" | "TASK";
  fields: string[];
  includeParent: boolean;
  buttonLocation: "DETAIL" | "LIST";
  isActive: boolean;
}

interface FieldOption {
  value: string;
  label: string;
  entity: string;
}

const entityLabels: Record<string, string> = {
  CUSTOMER: "顧客",
  DEAL: "案件",
  PRODUCT: "商材",
  TASK: "タスク",
};

const buttonLocationLabels: Record<string, string> = {
  DETAIL: "詳細画面",
  LIST: "一覧画面",
};

export function WebhookSendForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  fields,
}: WebhookSendFormProps) {
  const [formData, setFormData] = useState<WebhookFormData>({
    name: "",
    buttonName: "",
    url: "",
    entity: "CUSTOMER",
    fields: [],
    includeParent: false,
    buttonLocation: "DETAIL",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        buttonName: "",
        url: "",
        entity: "CUSTOMER",
        fields: [],
        includeParent: false,
        buttonLocation: "DETAIL",
        isActive: true,
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!formData.name.trim()) {
      setError("Webhook名を入力してください");
      return;
    }
    if (!formData.buttonName.trim()) {
      setError("ボタン名を入力してください");
      return;
    }
    if (!formData.url.trim()) {
      setError("Webhook URLを入力してください");
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      setError("有効なURLを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 選択されたエンティティに対応するフィールドをフィルター
  const availableFields = fields.filter(
    (f) => f.entity === formData.entity
  );

  // 親エンティティのフィールドも取得（includeParentがtrueの場合）
  const getParentFields = useCallback(() => {
    if (!formData.includeParent) return [];

    switch (formData.entity) {
      case "DEAL":
        return fields.filter((f) => f.entity === "CUSTOMER").map((f) => ({
          ...f,
          value: `顧客_${f.value}`,
          label: `顧客.${f.label}`,
        }));
      case "PRODUCT":
        return [
          ...fields.filter((f) => f.entity === "DEAL").map((f) => ({
            ...f,
            value: `案件_${f.value}`,
            label: `案件.${f.label}`,
          })),
          ...fields.filter((f) => f.entity === "CUSTOMER").map((f) => ({
            ...f,
            value: `顧客_${f.value}`,
            label: `顧客.${f.label}`,
          })),
        ];
      case "TASK":
        return [
          ...fields.filter((f) => f.entity === "DEAL").map((f) => ({
            ...f,
            value: `案件_${f.value}`,
            label: `案件.${f.label}`,
          })),
          ...fields.filter((f) => f.entity === "PRODUCT").map((f) => ({
            ...f,
            value: `商材_${f.value}`,
            label: `商材.${f.label}`,
          })),
          ...fields.filter((f) => f.entity === "CUSTOMER").map((f) => ({
            ...f,
            value: `顧客_${f.value}`,
            label: `顧客.${f.label}`,
          })),
        ];
      default:
        return [];
    }
  }, [fields, formData.entity, formData.includeParent]);

  const parentFields = getParentFields();

  const handleFieldToggle = (fieldValue: string) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldValue)
        ? prev.fields.filter((f) => f !== fieldValue)
        : [...prev.fields, fieldValue],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">
            {initialData ? "Webhookを編集" : "Webhookを追加"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Webhook名 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Webhook名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="例: Zapier連携（契約通知）"
            />
          </div>

          {/* ボタン名 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              ボタン名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.buttonName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, buttonName: e.target.value }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="例: 契約をZapierに送信"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              画面上に表示されるボタンのテキスト
            </p>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Webhook URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://hooks.zapier.com/hooks/catch/xxx/yyy"
            />
          </div>

          {/* 連携先DB */}
          <div>
            <label className="block text-sm font-medium mb-1">
              連携先DB <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.entity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  entity: e.target.value as WebhookFormData["entity"],
                  fields: [], // エンティティ変更時にフィールド選択をリセット
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(entityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* ボタン配置場所 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              ボタン配置場所
            </label>
            <select
              value={formData.buttonLocation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  buttonLocation: e.target.value as WebhookFormData["buttonLocation"],
                }))
              }
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(buttonLocationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* リレーション先のデータも送信 */}
          {formData.entity !== "CUSTOMER" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeParent"
                checked={formData.includeParent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeParent: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="includeParent" className="text-sm">
                リレーション先（親方向）のデータも送信
              </label>
            </div>
          )}

          {/* 送信項目選択 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              送信項目
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              選択しない場合は全フィールドを送信します
            </p>
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              {availableFields.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {entityLabels[formData.entity]}のフィールド
                  </div>
                  {availableFields.map((field) => (
                    <div key={field.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`field-${field.value}`}
                        checked={formData.fields.includes(field.value)}
                        onChange={() => handleFieldToggle(field.value)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor={`field-${field.value}`}
                        className="text-sm"
                      >
                        {field.label}
                      </label>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  フィールドが登録されていません
                </p>
              )}

              {/* 親フィールド */}
              {formData.includeParent && parentFields.length > 0 && (
                <>
                  <div className="border-t my-2" />
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    リレーション先のフィールド
                  </div>
                  {parentFields.map((field) => (
                    <div key={field.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`field-${field.value}`}
                        checked={formData.fields.includes(field.value)}
                        onChange={() => handleFieldToggle(field.value)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor={`field-${field.value}`}
                        className="text-sm text-muted-foreground"
                      >
                        {field.label}
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm">
              有効にする
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {initialData ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
