# responsive-settings-page

設定ページのレスポンシブパターン（タブ横スクロール + モバイル/デスクトップ切り替え）

## 概要

管理画面や設定ページでよく使われるレスポンシブパターンを提供する。主に以下の要素で構成される：

1. **サイドナビ/タブの横スクロール対応** - モバイルでタブが収まらない場合に横スクロール
2. **テーブル/カード切り替え** - モバイルではカード表示、デスクトップではテーブル表示
3. **コンテンツの条件付き表示** - 画面サイズに応じて表示要素を調整

## 使用場面

- 設定画面（ユーザー管理、フィールド管理など）
- 管理画面のタブUI
- データ一覧画面のレスポンシブ対応

---

## 1. タブの横スクロール対応

### パターン: overflow-x-auto + whitespace-nowrap

```tsx
// タブナビゲーション（横スクロール対応）
<div className="border-b overflow-x-auto">
  <nav className="flex gap-2 md:gap-4 whitespace-nowrap">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`
          px-3 md:px-4 py-2
          border-b-2 font-medium text-sm
          transition-colors shrink-0
          ${activeTab === tab.id
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
          }
        `}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

### 重要なクラス

| クラス | 役割 |
|--------|------|
| `overflow-x-auto` | 横スクロールを有効化 |
| `whitespace-nowrap` | 折り返しを防止 |
| `shrink-0` | タブが縮まないようにする |
| `gap-2 md:gap-4` | モバイル時は狭く、デスクトップ時は広く |

---

## 2. サイドナビゲーションの横スクロール対応

### SettingsTabsコンポーネント例

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SettingsTab {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const settingsTabs: SettingsTab[] = [
  { label: 'ユーザー管理', href: '/settings/users', icon: Users, description: '...' },
  { label: '目標管理', href: '/settings/targets', icon: Target, description: '...' },
  // ...
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto">
      {/* モバイル: 横スクロール / デスクトップ: 縦並び */}
      <div className="flex gap-1 md:flex-col whitespace-nowrap md:whitespace-normal">
        {settingsTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 md:gap-3 rounded-lg px-3 py-2 md:py-2.5 text-sm transition-colors shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">{tab.label}</span>
                {/* 説明文はデスクトップのみ */}
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
```

### ポイント

- `flex gap-1 md:flex-col` - モバイル時は横並び、デスクトップ時は縦並び
- `whitespace-nowrap md:whitespace-normal` - モバイル時のみ折り返し防止
- `shrink-0` - 各タブが縮まないように固定

---

## 3. テーブル/カード切り替えパターン

### 基本構造

```tsx
{/* モバイル表示: カード */}
<div className="block md:hidden space-y-3">
  {items.map((item) => (
    <div key={item.id} className="rounded-lg border bg-white p-4 shadow-sm">
      {/* カード内容 */}
    </div>
  ))}
</div>

{/* デスクトップ表示: テーブル */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

### カード表示の詳細パターン

```tsx
{/* モバイル表示: カード */}
<div className="block md:hidden space-y-3">
  {users.map((user) => (
    <div key={user.id} className="rounded-lg border bg-white p-4 shadow-sm">
      {/* ヘッダー部分 */}
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
        {/* アクションボタン */}
        <button className="rounded-md p-1.5 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* 詳細情報（2列グリッド） */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-muted-foreground">権限</div>
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
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
```

### テーブル表示の詳細パターン

```tsx
{/* デスクトップ表示: テーブル */}
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
      {users.map((user) => (
        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
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
```

---

## 4. 重要なTailwindクラスまとめ

### 表示切り替え

| パターン | 用途 |
|----------|------|
| `block md:hidden` | モバイルのみ表示 |
| `hidden md:block` | デスクトップのみ表示 |
| `hidden sm:inline` | スマホでは非表示、タブレット以上で表示 |

### スクロール対応

| パターン | 用途 |
|----------|------|
| `overflow-x-auto` | 横スクロール有効化 |
| `whitespace-nowrap` | 折り返し防止 |
| `shrink-0` | 縮小防止 |
| `min-w-max` | コンテンツ幅を確保 |

### レイアウト切り替え

| パターン | 用途 |
|----------|------|
| `flex md:flex-col` | モバイル横並び → デスクトップ縦並び |
| `grid-cols-1 md:grid-cols-2` | モバイル1列 → デスクトップ2列 |
| `gap-2 md:gap-4` | 間隔の調整 |

---

## 5. ベストプラクティス

1. **モバイルファーストで設計** - デフォルトをモバイル向けに、`md:` でデスクトップ対応
2. **タッチ操作を考慮** - ボタンやリンクは最低44pxのタップ領域を確保
3. **情報の優先度** - モバイルでは重要な情報のみ表示、詳細はデスクトップで
4. **スクロール方向を明示** - 横スクロールがある場合は視覚的に分かるように
5. **アクションボタンの縦積み** - モバイルでは `flex-col` でボタンを縦に配置

---

## 参考ファイル

- `src/components/settings/SettingsTabs.tsx` - サイドナビの横スクロール対応
- `src/app/(dashboard)/settings/users/page.tsx` - テーブル/カード切り替え
- `src/app/(dashboard)/settings/fields/page.tsx` - タブ + テーブル/カード切り替え
