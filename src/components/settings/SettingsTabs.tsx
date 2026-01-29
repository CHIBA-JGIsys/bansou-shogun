"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Target, ListTodo, Zap, FileSliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTab {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const settingsTabs: SettingsTab[] = [
  {
    label: "ユーザー管理",
    href: "/settings/users",
    icon: Users,
    description: "ユーザーの追加・編集・削除",
  },
  {
    label: "目標管理",
    href: "/settings/targets",
    icon: Target,
    description: "月次売上目標の設定",
  },
  {
    label: "TODOテンプレート",
    href: "/settings/templates",
    icon: ListTodo,
    description: "テンプレートの作成・編集",
  },
  {
    label: "自動化",
    href: "/settings/automation",
    icon: Zap,
    description: "Webhook連携の設定",
  },
  {
    label: "フィールド管理",
    href: "/settings/fields",
    icon: FileSliders,
    description: "カスタムフィールドの設定",
  },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto">
      {/* モバイル: 横スクロール可能なタブ */}
      <div className="flex gap-1 md:flex-col whitespace-nowrap md:whitespace-normal">
        {settingsTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 md:gap-3 rounded-lg px-3 py-2 md:py-2.5 text-sm transition-colors shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">{tab.label}</span>
                {/* 説明文はデスクトップのみ表示 */}
                {!isActive && (
                  <span className="hidden md:block text-xs text-muted-foreground/70">
                    {tab.description}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
