# responsive-sidebar-layout

レスポンシブサイドバーレイアウト（ハンバーガーメニュー + スライドイン + オーバーレイ）の実装スキル。

## 概要

デスクトップでは常時表示、モバイルではハンバーガーメニューでスライドイン表示するサイドバーレイアウトを実装する。

### 使用場面

- 管理画面ダッシュボード
- 多機能なWebアプリケーション
- サイドナビゲーションが必要なSPA

### 主要な特徴

- デスクトップ（lg以上）: サイドバー常時表示
- モバイル（lg未満）: ハンバーガーメニューでスライドイン
- オーバーレイクリックでサイドバー閉じる
- リンククリック時にサイドバー自動で閉じる

## 実装手順

### 1. layout.tsx のクライアントコンポーネント化

Next.js App Router のレイアウトをクライアントコンポーネントに変更する。

```tsx
"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // サイドバーの開閉状態を管理
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* サイドバー */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* モバイル用オーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 2. Sidebar コンポーネント

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // モバイルでリンククリック時にサイドバーを閉じる
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        // 基本スタイル
        "fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground",
        // アニメーション
        "transform transition-transform duration-300 ease-in-out",
        // デスクトップでは常に表示
        "lg:relative lg:translate-x-0",
        // モバイルでは isOpen に応じて表示/非表示
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      {/* ロゴ */}
      <div className="flex h-14 items-center border-b px-4">
        <Logo />
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/80 hover:bg-sidebar-muted"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### 3. Header コンポーネント（ハンバーガーメニュー追加）

```tsx
"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  onMenuClick?: () => void;
}

export function Header({ className, onMenuClick }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b bg-background px-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* ハンバーガーメニュー（lg未満で表示） */}
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* 検索バーなど他の要素 */}
      </div>

      {/* 右側の要素（通知、ユーザーメニューなど） */}
    </header>
  );
}
```

## 重要なポイント

### z-index の設計

| 要素 | z-index | 説明 |
|------|---------|------|
| Sidebar | z-50 | 最前面に表示 |
| Overlay | z-40 | サイドバーの背後、コンテンツの前面 |

### Tailwind CSS クラス

| 用途 | クラス |
|------|--------|
| デスクトップで常時表示 | `lg:relative lg:translate-x-0` |
| モバイルで非表示 | `-translate-x-full` |
| モバイルで表示 | `translate-x-0` |
| スライドアニメーション | `transition-transform duration-300 ease-in-out` |
| オーバーレイ | `fixed inset-0 bg-black/50 lg:hidden` |
| ハンバーガー表示条件 | `lg:hidden` |

### 必要なインポート

```tsx
// lucide-react
import { Menu } from "lucide-react";

// Next.js
import { usePathname } from "next/navigation";

// React
import { useState } from "react";
```

## チェックリスト

- [ ] layout.tsx に `"use client"` を追加
- [ ] `useState` でサイドバー状態管理
- [ ] Sidebar に `isOpen` と `onClose` props を追加
- [ ] Sidebar のクラスに `lg:relative lg:translate-x-0` を追加
- [ ] Sidebar のクラスに `isOpen ? "translate-x-0" : "-translate-x-full"` を追加
- [ ] オーバーレイ要素を追加（`z-40 bg-black/50 lg:hidden`）
- [ ] Header に `onMenuClick` prop を追加
- [ ] Header にハンバーガーボタンを追加（`lg:hidden`）
- [ ] `Menu` アイコンをインポート（lucide-react）
- [ ] Sidebar のリンククリック時に `onClose` を呼び出し

## 応用

### 右からスライドイン

```tsx
// Sidebar のクラスを変更
"fixed inset-y-0 right-0" // left-0 → right-0
isOpen ? "translate-x-0" : "translate-x-full" // -translate-x-full → translate-x-full
```

### 閉じるボタンを追加

```tsx
// Sidebar 内に追加
<button
  onClick={onClose}
  className="absolute right-2 top-2 lg:hidden p-2 rounded-md hover:bg-muted"
>
  <X className="h-5 w-5" />
</button>
```
