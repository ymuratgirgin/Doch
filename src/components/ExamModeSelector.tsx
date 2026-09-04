"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExamMode } from "@/lib/examSchema";

type ModeOption = {
  mode: ExamMode;
  title: string;
  description: string;
  recommended?: boolean;
};

export default function ExamModeSelector({
  options,
  defaultMode,
}: {
  options: ModeOption[];
  defaultMode: ExamMode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ExamMode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate exam");
      router.push(`/exams/${data.examId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((opt) => {
          const isSelected = selected === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setSelected(opt.mode)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition ${
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                  : opt.recommended
                    ? "border-blue-300 bg-white ring-1 ring-blue-200 hover:border-blue-400"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              {opt.recommended && !isSelected && (
                <span className="absolute -top-2 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  Recommended today
                </span>
              )}
              <span className="font-medium">{opt.title}</span>
              <span className={isSelected ? "text-sm text-neutral-300" : "text-sm text-neutral-500"}>
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Generating… this can take a couple of minutes" : "Mock Exam Generate"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
