"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

type Customer = {
  id: string;
  name: string;
  clientNo: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Deal = {
  id: string;
  name: string;
  customerId: string;
  dealType: string | null;
  progress: string;
  occurredDate: string | null;
  lastContactDate: string | null;
  isImportant: boolean;
  notes: string | null;
};

export default function EditDealPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    dealType: "",
    progress: "LEAD",
    occurredDate: "",
    lastContactDate: "",
    isImportant: false,
    notes: "",
    salesRepId: "",
    officeRepId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealRes, customersRes] = await Promise.all([
          fetch(`/api/deals/${id}`),
          fetch("/api/customers?limit=100"),
        ]);

        const dealData = await dealRes.json();
        const customersData = await customersRes.json();

        if (dealData.success) {
          const deal = dealData.data;
          setFormData({
            name: deal.name || "",
            customerId: deal.customerId || "",
            dealType: deal.dealType || "",
            progress: deal.progress || "LEAD",
            occurredDate: deal.occurredDate
              ? new Date(deal.occurredDate).toISOString().split("T")[0]
              : "",
            lastContactDate: deal.lastContactDate
              ? new Date(deal.lastContactDate).toISOString().split("T")[0]
              : "",
            isImportant: deal.isImportant || false,
            notes: deal.notes || "",
            salesRepId: deal.salesRepId || "",
            officeRepId: deal.officeRepId || "",
          });
        } else {
          router.push("/deals");
          return;
        }

        if (customersData.success) {
          setCustomers(customersData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        router.push("/deals");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "案件名は必須です";
    }
    if (!formData.customerId) {
      newErrors.customerId = "顧客は必須です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dealType: formData.dealType || null,
          occurredDate: formData.occurredDate || null,
          lastContactDate: formData.lastContactDate || null,
          salesRepId: formData.salesRepId || null,
          officeRepId: formData.officeRepId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/deals/${id}`);
      } else {
        alert(data.error || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update deal:", error);
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="案件を編集"
        description="案件情報を更新します"
        backHref={`/deals/${id}`}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6 space-y-4">
          {/* 案件名 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              案件名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.name ? "border-red-500" : ""
              }`}
              placeholder="例: ABC社 ウェブサイトリニューアル"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 顧客 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              顧客 <span className="text-red-500">*</span>
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.customerId ? "border-red-500" : ""
              }`}
            >
              <option value="">顧客を選択してください</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.clientNo})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="mt-1 text-xs text-red-500">{errors.customerId}</p>
            )}
          </div>

          {/* 顧客種別・進捗 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">顧客種別</label>
              <select
                name="dealType"
                value={formData.dealType}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">選択してください</option>
                <option value="NEW">新規</option>
                <option value="EXISTING">既存</option>
                <option value="REFERRAL">紹介</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">進捗</label>
              <select
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="LEAD">リード</option>
                <option value="FIRST_MEETING">初回面談</option>
                <option value="WAITING_DETAILS">明細待ち</option>
                <option value="DETAILS_OBTAINED">明細取得済み</option>
              </select>
            </div>
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">発生日</label>
              <input
                type="date"
                name="occurredDate"
                value={formData.occurredDate}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                最終コンタクト日
              </label>
              <input
                type="date"
                name="lastContactDate"
                value={formData.lastContactDate}
                onChange={handleChange}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* 重要案件 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isImportant"
              name="isImportant"
              checked={formData.isImportant}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isImportant" className="text-sm font-medium">
              重要案件としてマーク
            </label>
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="案件に関するメモを入力してください"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/deals/${id}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                更新
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
