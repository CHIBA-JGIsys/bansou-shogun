"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Bell } from "lucide-react";

// Types
interface Deal {
  id: string;
  name: string;
  customerName: string;
  expectedAmount: number;
  progress: string;
}

interface Product {
  id: string;
  name: string;
  dealName: string;
  customerName: string;
  expectedCloseDate: string;
  daysPastDue: number;
}

interface ActionCenterProps {
  hotLeads?: Deal[];
  updateAlerts?: Product[];
}

// Progress badge colors
const progressColors: Record<string, string> = {
  LEAD: "bg-gray-100 text-gray-700",
  FIRST_MEETING: "bg-blue-100 text-blue-700",
  WAITING_DETAILS: "bg-yellow-100 text-yellow-700",
  DETAILS_OBTAINED: "bg-green-100 text-green-700",
};

const progressLabels: Record<string, string> = {
  LEAD: "リード",
  FIRST_MEETING: "初回面談",
  WAITING_DETAILS: "明細待ち",
  DETAILS_OBTAINED: "明細取得済み",
};

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ActionCenter({ hotLeads = [], updateAlerts = [] }: ActionCenterProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Tabs defaultValue="hot-leads" className="w-full">
        <div className="border-b px-4 pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            アクションセンター
          </h2>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="hot-leads" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              ホットリード
              {hotLeads.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {hotLeads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="update-alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              更新アラート
              {updateAlerts.length > 0 && (
                <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                  {updateAlerts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hot-leads" className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-3">
            確度Aの商材に紐づく案件一覧
          </p>
          {hotLeads.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Flame className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>ホットリードはありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hotLeads.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {deal.name}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          progressColors[deal.progress] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {progressLabels[deal.progress] || deal.progress}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.customerName}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(deal.expectedAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="update-alerts" className="p-4 pt-2">
          <p className="text-sm text-muted-foreground mb-3">
            次回フォロー予定日を過ぎている商材一覧
          </p>
          {updateAlerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>更新アラートはありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {updateAlerts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {product.name}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {product.daysPastDue}日超過
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {product.dealName} / {product.customerName}
                    </p>
                  </div>
                  <div className="text-right ml-4 text-sm text-muted-foreground">
                    期限: {product.expectedCloseDate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
