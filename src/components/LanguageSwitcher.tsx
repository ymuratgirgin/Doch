"use client";

import { LOCALES } from "@/lib/i18n";
import { useI18n } from "@/components/LanguageProvider";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();

  return (
    <select
      aria-label={t.languageSwitcher.label}
      value={locale}
      onChange={(e) => setLocale(e.target.value as typeof locale)}
      className={
        className ??
        "min-h-11 rounded-md border border-blue-200 bg-white px-2 py-1 text-sm text-blue-900"
      }
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {t.languageSwitcher.names[l]}
        </option>
      ))}
    </select>
  );
}
