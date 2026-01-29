# responsive-page-converter

既存ページをレスポンシブ対応に変換するパターン集

## 概要

モバイルファーストアプローチで、既存のデスクトップ向けページをレスポンシブ対応に変換するためのガイドライン。

### 使用場面

- 既存ページのモバイル対応
- 新規ページ作成時のレスポンシブ設計
- テーブル/カード表示の切り替え実装
- フォームのグリッドレイアウト調整

---

## Tailwind ブレークポイントガイドライン

| ブレークポイント | 画面幅 | 用途 | デバイス例 |
|-----------------|--------|------|-----------|
| (default) | < 640px | モバイル縦持ち | iPhone SE, iPhone 12 |
| `sm:` | >= 640px | モバイル横持ち | iPhone 横, 小型タブレット |
| `md:` | >= 768px | タブレット | iPad Mini, iPad |
| `lg:` | >= 1024px | デスクトップ | ノートPC, デスクトップ |
| `xl:` | >= 1280px | 大画面 | 外部モニター |

### 基本原則

```
モバイルファースト = デフォルトでモバイル用スタイル → md: 以上で拡張
```

---

## 1. 一覧ページの変換手順

### 使用コンポーネント

- `PageHeader`: ヘッダー（タイトル + アクションボタン）
- `ResponsiveTable`: モバイル=カード / デスクトップ=テーブル

### 変換パターン

```tsx
// Before: 固定テーブル
<table className="w-full">...</table>

// After: ResponsiveTable
import { PageHeader } from '@/components/ui/page-header'
import { ResponsiveTable } from '@/components/ui/responsive-table'

<div className="space-y-6 p-4 sm:p-6">
  <PageHeader
    title="タイトル"
    description="説明文"
    actions={
      <button className="...">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">新規作成</span>
        <span className="sm:hidden">追加</span>
      </button>
    }
  />

  <ResponsiveTable
    data={items}
    columns={columns}
    primaryField="name"
    onRowClick={(item) => router.push(`/items/${item.id}`)}
  />
</div>
```

### ボタンテキストの出し分け

```tsx
// 長いテキストはデスクトップのみ
<span className="hidden sm:inline">新規作成</span>
<span className="sm:hidden">追加</span>
```

---

## 2. 詳細ページの変換手順

### レイアウトパターン

```tsx
// 2カラムレイアウト（モバイル: 1列 / デスクトップ: 2列）
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 左カラム */}
  <div className="space-y-6">...</div>
  {/* 右カラム */}
  <div className="space-y-6">...</div>
</div>
```

### タブの横スクロール対応

```tsx
<div className="border-b overflow-x-auto">
  <nav className="flex gap-2 sm:gap-4 min-w-max">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={`
          inline-flex items-center gap-2
          border-b-2 px-3 sm:px-4 py-2
          text-sm font-medium
          whitespace-nowrap
          ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent'}
        `}
      >
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    ))}
  </nav>
</div>
```

### アクションボタン群

```tsx
<div className="flex flex-wrap items-center gap-2">
  <button className="inline-flex items-center gap-2 ...">
    <Pencil className="h-4 w-4" />
    <span className="hidden sm:inline">編集</span>
  </button>
  <button className="inline-flex items-center gap-2 ...">
    <Trash2 className="h-4 w-4" />
    <span className="hidden sm:inline">削除</span>
  </button>
</div>
```

---

## 3. フォームページの変換手順

### グリッドレイアウト

```tsx
// 基本: 1列 → md以上で2列
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 1列全体を使う項目 */}
  <div className="col-span-2 md:col-span-1">
    <label>会社名 *</label>
    <input type="text" className="w-full ..." />
  </div>

  {/* 常に2列分使う項目（テキストエリアなど） */}
  <div className="col-span-2">
    <label>備考</label>
    <textarea className="w-full ..." />
  </div>
</div>
```

### フォームセクション

```tsx
<div className="rounded-lg border bg-white p-4 sm:p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">セクション名</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    ...
  </div>
</div>
```

---

## 4. タブの横スクロール対応

### 設定ページのタブナビゲーション

```tsx
<nav className="overflow-x-auto">
  <div className="flex gap-1 md:flex-col whitespace-nowrap md:whitespace-normal">
    {tabs.map((tab) => (
      <Link
        href={tab.href}
        className="flex items-center gap-2 md:gap-3 rounded-lg px-3 py-2 md:py-2.5 text-sm shrink-0"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-medium">{tab.label}</span>
        {/* 説明文はデスクトップのみ */}
        <span className="hidden md:block text-xs text-muted-foreground">
          {tab.description}
        </span>
      </Link>
    ))}
  </div>
</nav>
```

### 水平タブ

```tsx
<div className="border-b overflow-x-auto">
  <nav className="flex gap-2 md:gap-4 whitespace-nowrap">
    {tabs.map((tab) => (
      <button
        className={`
          px-3 md:px-4 py-2
          border-b-2 font-medium text-sm
          shrink-0
        `}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

---

## 5. テーブル / カード切り替え

### 手動実装パターン

```tsx
{/* モバイル: カード表示 */}
<div className="block md:hidden space-y-3">
  {data.map((item) => (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      {/* プライマリ情報を大きく */}
      <div className="font-semibold text-gray-900 mb-3">
        {item.name}
      </div>
      {/* その他の情報は2列グリッド */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-gray-500">ラベル1</div>
          <div>{item.field1}</div>
        </div>
        <div>
          <div className="text-gray-500">ラベル2</div>
          <div>{item.field2}</div>
        </div>
      </div>
    </div>
  ))}
</div>

{/* デスクトップ: テーブル表示 */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

---

## 6. チェックリスト

### 一覧ページ

- [ ] `p-4 sm:p-6` でコンテナにパディング追加
- [ ] `PageHeader` コンポーネント使用
- [ ] ボタンテキスト: `hidden sm:inline` / `sm:hidden` で出し分け
- [ ] テーブルを `ResponsiveTable` に置換、または手動でカード/テーブル切り替え
- [ ] ページネーションのテキスト簡略化（モバイル）

### 詳細ページ

- [ ] `grid grid-cols-1 md:grid-cols-2 gap-6` で2カラムレイアウト
- [ ] タブに `overflow-x-auto` と `whitespace-nowrap` 追加
- [ ] タブラベル: `hidden sm:inline` で長いテキストを隠す
- [ ] アクションボタン: `flex-wrap` で折り返し対応
- [ ] コンテンツカード: `p-4 sm:p-6` でパディング調整

### フォームページ

- [ ] フォームグリッド: `grid-cols-1 md:grid-cols-2`
- [ ] 全幅項目: `col-span-2`
- [ ] セクション: `p-4 sm:p-6` でパディング調整
- [ ] ボタン群: モバイルでは縦並びも検討

### 共通

- [ ] テキストサイズ: `text-sm` を基本に
- [ ] アイコン: `shrink-0` で縮小防止
- [ ] 長いテキスト: `truncate` で省略表示
- [ ] 横スクロール: `overflow-x-auto` を親要素に

---

## 7. よく使うクラスパターン

```css
/* パディング調整 */
p-4 sm:p-6

/* テキスト出し分け */
hidden sm:inline  /* smから表示 */
sm:hidden         /* smから非表示 */

/* グリッド */
grid grid-cols-1 md:grid-cols-2 gap-4
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

/* フレックス */
flex flex-col md:flex-row gap-4
flex flex-wrap items-center gap-2

/* 横スクロール */
overflow-x-auto whitespace-nowrap

/* カード/テーブル切り替え */
block md:hidden   /* モバイルのみ表示 */
hidden md:block   /* デスクトップのみ表示 */
```

---

## 参考実装

- 一覧ページ: `src/app/(dashboard)/customers/page.tsx`
- 詳細ページ: `src/app/(dashboard)/customers/[id]/page.tsx`
- フォームページ: `src/app/(dashboard)/customers/new/page.tsx`
- 設定タブ: `src/components/settings/SettingsTabs.tsx`
- レスポンシブテーブル: `src/components/ui/responsive-table.tsx`
