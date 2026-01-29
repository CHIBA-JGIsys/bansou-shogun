import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { Settings } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - Tab Navigation */}
      <div className="w-64 shrink-0">
        <div className="sticky top-0">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">設定</h1>
          </div>
          <SettingsTabs />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="rounded-lg border bg-card p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
