"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, Shield } from "lucide-react";

// モックユーザーデータ
const mockUsers = [
  {
    id: "1",
    name: "山田 太郎",
    email: "yamada@example.com",
    role: "ADMIN",
    invitedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "SALES",
    invitedAt: "2024-02-20",
  },
  {
    id: "3",
    name: "鈴木 一郎",
    email: "suzuki@example.com",
    role: "OFFICE",
    invitedAt: "2024-03-10",
  },
];

const roleLabels: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "管理者", color: "bg-purple-100 text-purple-700" },
  SALES: { label: "営業担当", color: "bg-blue-100 text-blue-700" },
  OFFICE: { label: "事務担当", color: "bg-green-100 text-green-700" },
};

export default function UsersSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">ユーザー管理</h2>
          <p className="text-sm text-muted-foreground">
            ユーザーの追加・編集・削除を行います
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          ユーザーを招待
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="名前またはメールアドレスで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* User List - モバイル: カード / デスクトップ: テーブル */}
      {/* モバイル表示 */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </div>
                </div>
              </div>
              <button className="rounded-md p-1.5 hover:bg-muted">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">権限</div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    roleLabels[user.role].color
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {roleLabels[user.role].label}
                </span>
              </div>
              <div>
                <div className="text-muted-foreground">招待日</div>
                <div>{user.invitedAt}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* デスクトップ表示 */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                ユーザー
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                権限
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                招待日
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      roleLabels[user.role].color
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabels[user.role].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {user.invitedAt}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-md p-1.5 hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>合計: {mockUsers.length}名</span>
        <span>•</span>
        <span>管理者: {mockUsers.filter((u) => u.role === "ADMIN").length}名</span>
        <span>•</span>
        <span>営業: {mockUsers.filter((u) => u.role === "SALES").length}名</span>
        <span>•</span>
        <span>事務: {mockUsers.filter((u) => u.role === "OFFICE").length}名</span>
      </div>
    </div>
  );
}
