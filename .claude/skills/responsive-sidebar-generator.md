# Responsive Sidebar Generator

レスポンシブ対応のサイドバー + モバイルボトムナビゲーションを生成するスキル。

## 概要と使用場面

### 使用場面
- ダッシュボード系アプリケーションのナビゲーション実装
- デスクトップ: 左サイドバー固定
- モバイル: ハンバーガーメニュー + ボトムナビ

### 特徴
- デスクトップ（lg以上）: 常時表示のサイドバー
- モバイル: スライドイン/アウトするサイドバー + ボトムナビ
- navItemsを1箇所で定義し、両方で共有
- アクティブ状態の視覚フィードバック

---

## ファイル構成

```
src/components/
├── Sidebar.tsx       # メインサイドバー（レスポンシブ対応）
├── MobileNav.tsx     # モバイル用ボトムナビ
└── Logo.tsx          # ロゴコンポーネント（オプション）
```

---

## 1. NavItem型とnavItems定義

```typescript
// Sidebar.tsx 内で定義し、エクスポート

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;  // 権限制御用（オプション）
}

const navItems: NavItem[] = [
  { label: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { label: "顧客", href: "/customers", icon: Users },
  { label: "案件", href: "/deals", icon: Briefcase },
  { label: "商材", href: "/products", icon: Package },
  { label: "タスク", href: "/tasks", icon: CheckSquare },
  { label: "ゴミ箱", href: "/trash", icon: Trash2 },
  { label: "設定", href: "/settings", icon: Settings, adminOnly: true },
];

// エクスポート（MobileNavで使用）
export { navItems };
export type { NavItem };
```

---

## 2. Sidebar コンポーネント

### Props設計

```typescript
interface SidebarProps {
  className?: string;
  isAdmin?: boolean;      // 権限によるフィルタリング
  isOpen?: boolean;       // モバイルでの開閉状態
  onClose?: () => void;   // モバイルでリンククリック時に閉じる
}
```

### レスポンシブクラス設計

```typescript
<aside
  className={cn(
    // 基本スタイル
    "fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col",
    "bg-sidebar text-sidebar-foreground",

    // アニメーション
    "transform transition-transform duration-300 ease-in-out",

    // レスポンシブ対応
    "lg:relative lg:translate-x-0",  // デスクトップ: 常時表示

    // モバイルでの開閉
    isOpen ? "translate-x-0" : "-translate-x-full",

    className
  )}
>
```

### 主要ポイント

| クラス | 説明 |
|--------|------|
| `fixed inset-y-0 left-0` | 画面左端に固定 |
| `z-50` | 他要素より前面に |
| `lg:relative` | デスクトップでは相対配置 |
| `lg:translate-x-0` | デスクトップでは常時表示 |
| `translate-x-0 / -translate-x-full` | モバイルでのスライド制御 |
| `transition-transform duration-300` | スムーズなアニメーション |

### リンククリック時の処理

```typescript
const handleLinkClick = () => {
  // モバイルでリンククリック時にサイドバーを閉じる
  if (onClose) {
    onClose();
  }
};
```

---

## 3. MobileNav コンポーネント

### 特徴
- 画面下部に固定表示
- lg以上では非表示（`lg:hidden`）
- navItemsの先頭5件を表示

### 実装

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems, NavItem } from "./Sidebar";

interface MobileNavProps {
  className?: string;
  isAdmin?: boolean;
}

export function MobileNav({ className, isAdmin = true }: MobileNavProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden",
        className
      )}
    >
      <div className="flex items-center justify-around py-2">
        {filteredNavItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## 4. Layout での統合

### 親コンポーネントでの使用例

```typescript
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* オーバーレイ（モバイルでサイドバー開時） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* モバイルボトムナビ */}
      <MobileNav />
    </div>
  );
}
```

### Header でのハンバーガーメニュー

```typescript
interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="...">
      {/* モバイル用メニューボタン */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-muted"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 他のヘッダー要素 */}
    </header>
  );
}
```

---

## 5. 必要なCSS変数（tailwind.config.ts）

```typescript
// globals.css または tailwind.config.ts

:root {
  --sidebar: 220 20% 20%;         /* サイドバー背景色 */
  --sidebar-foreground: 0 0% 98%; /* サイドバーテキスト色 */
  --sidebar-muted: 220 20% 25%;   /* ホバー時背景 */
  --sidebar-accent: 220 90% 56%;  /* アクティブ時背景 */
}
```

---

## チェックリスト

- [ ] navItems を1箇所で定義し、エクスポート
- [ ] Sidebar に isOpen / onClose props を実装
- [ ] レスポンシブクラス（lg:relative, lg:translate-x-0）適用
- [ ] MobileNav で navItems をインポートして再利用
- [ ] Layout でオーバーレイ + 状態管理
- [ ] Header にハンバーガーメニューボタン
- [ ] メインコンテンツに pb-20 lg:pb-4（ボトムナビ分のパディング）
