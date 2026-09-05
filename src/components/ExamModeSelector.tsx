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
              className={`relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${
                isSelected
                  ? "border-orange-300 bg-orange-200 text-orange-950 shadow-sm"
                  : opt.recommended
                    ? "border-blue-200 bg-blue-50 hover:border-blue-300"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              {opt.recommended && !isSelected && (
                <span className="absolute -top-2 right-3 rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-900">
                  Recommended today
                </span>
              )}
              <span className="font-medium">{opt.title}</span>
              <span className={isSelected ? "text-sm text-orange-900" : "text-sm text-neutral-500"}>
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
          className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
        >
          {loading ? "Generating… this can take a couple of minutes" : "Mock Exam Generate"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
