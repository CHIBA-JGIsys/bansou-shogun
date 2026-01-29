"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, List, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * PageHeader Props
 */
interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  backHref?: string
  className?: string
}

/**
 * PageHeader - ページヘッダー共通コンポーネント
 *
 * モバイル: 縦積み（タイトル上、アクション下）
 * デスクトップ: 横並び（タイトル左、アクション右）
 */
function PageHeader({
  title,
  description,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Link>
        )}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

/**
 * ViewToggle Props
 */
interface ViewToggleProps {
  view: "list" | "kanban"
  onViewChange: (view: "list" | "kanban") => void
  listLabel?: string
  kanbanLabel?: string
  className?: string
}

/**
 * ViewToggle - 一覧/カンバン切り替えコンポーネント
 *
 * モバイル: アイコンのみ
 * デスクトップ: アイコン + テキスト
 */
function ViewToggle({
  view,
  onViewChange,
  listLabel = "一覧",
  kanbanLabel = "カンバン",
  className,
}: ViewToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-muted p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">{listLabel}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange("kanban")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          view === "kanban"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">{kanbanLabel}</span>
      </button>
    </div>
  )
}

export { PageHeader, ViewToggle }
export type { PageHeaderProps, ViewToggleProps }
