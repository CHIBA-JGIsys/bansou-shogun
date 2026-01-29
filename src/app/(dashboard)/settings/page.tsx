import { redirect } from "next/navigation";

export default function SettingsPage() {
  // デフォルトでユーザー管理タブにリダイレクト
  redirect("/settings/users");
}
