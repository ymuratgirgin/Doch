"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEMES, THEME_STORAGE_KEY, Theme, applyTheme, readTheme } from "@/lib/theme";
import { useI18n } from "@/components/LanguageProvider";

const THEME_EVENT = "doch-theme-change";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export default function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useI18n();
  // Server render and hydration use "light"; the stored choice is read right after.
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");

  // In "System" mode, follow the OS setting while the page is open.
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage blocked: the choice still applies until the page is closed
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <select
      aria-label={t.themeSwitcher.label}
      value={theme}
      onChange={(e) => choose(e.target.value as Theme)}
      className={
        className ??
        "min-h-11 rounded-md border border-blue-200 bg-white px-2 py-1 text-sm text-blue-900"
      }
    >
      {THEMES.map((th) => (
        <option key={th} value={th}>
          {t.themeSwitcher.names[th]}
        </option>
      ))}
    </select>
  );
}
