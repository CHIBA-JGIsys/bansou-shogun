"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  CheckSquare,
  Trash2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
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

interface SidebarProps {
  className?: string;
  isAdmin?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isAdmin = true, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleLinkClick = () => {
    // モバイルでリンククリック時にサイドバーを閉じる
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground",
        "transform transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-muted px-4">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-muted hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-muted p-4">
        <p className="text-xs text-sidebar-foreground/60">
          CRM System v0.1.0
        </p>
      </div>
    </aside>
  );
}

// navItemsをエクスポート（MobileNavで使用）
export { navItems };
export type { NavItem };
