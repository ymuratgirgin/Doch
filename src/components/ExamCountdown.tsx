"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const msPerDay = 86_400_000;
  return Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay);
}

export default function ExamCountdown({ examDate }: { examDate: string | null }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [editing, setEditing] = useState(!examDate);
  const [value, setValue] = useState(examDate ? examDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/user/exam-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: value || null }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const dateLocale = locale === "de" ? "de-DE" : locale === "tr" ? "tr-TR" : "en-US";

  if (editing) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">
          {examDate ? t.examCountdown.updateDate : t.examCountdown.whenIsExam}
        </p>
        {!examDate && <p className="mt-1">{t.examCountdown.registerHint}</p>}
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-orange-300 px-3 py-1.5 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {saving ? "…" : t.examCountdown.save}
          </button>
          {examDate && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              {t.examCountdown.cancel}
            </button>
          )}
        </div>
      </div>
    );
  }

  const days = daysUntil(examDate!);
  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-white px-4 py-3">
      <p className="text-sm">
        {days > 0 ? (
          t.examCountdown.daysUntil(days, new Date(examDate!).toLocaleDateString(dateLocale))
        ) : days === 0 ? (
          <span className="font-semibold">{t.examCountdown.examToday}</span>
        ) : (
          <span className="text-neutral-500">
            {t.examCountdown.examPassed(new Date(examDate!).toLocaleDateString(dateLocale))}
          </span>
        )}
      </p>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-neutral-500 underline hover:text-neutral-800"
      >
        {t.examCountdown.editBtn}
      </button>
    </div>
  );
}
