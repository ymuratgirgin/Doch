"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";

export default function LogoutButton() {
  const router = useRouter();
  const { t } = useI18n();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-blue-700 hover:text-blue-900"
    >
      {t.common.logOut}
    </button>
  );
}
