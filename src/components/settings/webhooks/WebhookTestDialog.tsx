"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, XCircle, Send } from "lucide-react";

interface WebhookTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  webhookId: string;
  webhookName: string;
  entity: string;
}

interface EntityRecord {
  id: string;
  name?: string;
  clientNo?: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  payload?: object;
  response?: string;
  error?: string;
}

const entityLabels: Record<string, string> = {
  CUSTOMER: "顧客",
  DEAL: "案件",
  PRODUCT: "商材",
  TASK: "タスク",
};

export function WebhookTestDialog({
  isOpen,
  onClose,
  webhookId,
  webhookName,
  entity,
}: WebhookTestDialogProps) {
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // レコード一覧を取得
  useEffect(() => {
    if (!isOpen) {
      setRecords([]);
      setSelectedRecordId("");
      setTestResult(null);
      return;
    }

    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const endpoint = getEndpointForEntity(entity);
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          // 最新10件のみ表示
          setRecords(Array.isArray(data) ? data.slice(0, 10) : []);
        }
      } catch (error) {
        console.error("Failed to fetch records:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [isOpen, entity]);

  const getEndpointForEntity = (entityType: string): string => {
    switch (entityType) {
      case "CUSTOMER":
        return "/api/customers";
      case "DEAL":
        return "/api/deals";
      case "PRODUCT":
        return "/api/products";
      case "TASK":
        return "/api/tasks";
      default:
        return "/api/customers";
    }
  };

  const getRecordDisplayName = (record: EntityRecord): string => {
    if (record.name) return record.name;
    if (record.clientNo) return record.clientNo;
    return record.id.substring(0, 8) + "...";
  };

  const handleTest = async () => {
    if (!selectedRecordId) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/webhooks/send/${webhookId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordId: selectedRecordId }),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">テスト送信</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Webhook Info */}
        <div className="mb-4 rounded-md bg-muted/50 p-3">
          <div className="text-sm font-medium">{webhookName}</div>
          <div className="text-xs text-muted-foreground">
            連携先: {entityLabels[entity]}
          </div>
        </div>

        {/* Record Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            テスト用レコードを選択
          </label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : records.length > 0 ? (
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">選択してください</option>
              {records.map((record) => (
                <option key={record.id} value={record.id}>
                  {getRecordDisplayName(record)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              テスト用のレコードがありません
            </p>
          )}
        </div>

        {/* Test Button */}
        <button
          onClick={handleTest}
          disabled={!selectedRecordId || isTesting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          テスト送信
        </button>

        {/* Test Result */}
        {testResult && (
          <div className="mt-6 space-y-3">
            <div
              className={`flex items-center gap-2 rounded-md p-3 ${
                testResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {testResult.success ? "送信成功" : "送信失敗"}
              </span>
              {testResult.status && (
                <span className="text-sm">
                  ({testResult.status} {testResult.statusText})
                </span>
              )}
            </div>

            {testResult.error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                エラー: {testResult.error}
              </div>
            )}

            {testResult.payload && (
              <div>
                <div className="text-sm font-medium mb-1">送信データ:</div>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                  {JSON.stringify(testResult.payload, null, 2)}
                </pre>
              </div>
            )}

            {testResult.response && (
              <div>
                <div className="text-sm font-medium mb-1">レスポンス:</div>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-32">
                  {testResult.response}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
