"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const msPerDay = 86_400_000;
  return Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay);
}

export default function ExamCountdown({ examDate }: { examDate: string | null }) {
  const router = useRouter();
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

  if (editing) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">
          {examDate ? "Update your exam date" : "When is your telc B1 exam?"}
        </p>
        {!examDate && (
          <p className="mt-1">
            Haven&apos;t registered yet? Book your exam soon so you have a
            real deadline to train toward.
          </p>
        )}
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
            className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
          {examDate && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Cancel
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
          <>
            <span className="text-lg font-semibold">{days}</span> day{days === 1 ? "" : "s"} until
            your telc B1 exam ({new Date(examDate!).toLocaleDateString()})
          </>
        ) : days === 0 ? (
          <span className="font-semibold">Your exam is today — good luck!</span>
        ) : (
          <span className="text-neutral-500">
            Exam date ({new Date(examDate!).toLocaleDateString()}) has passed.
          </span>
        )}
      </p>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-neutral-500 underline hover:text-neutral-800"
      >
        Edit
      </button>
    </div>
  );
}
