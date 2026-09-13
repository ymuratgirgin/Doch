"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExamMode } from "@/lib/examSchema";
import { useI18n } from "@/components/LanguageProvider";

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
  const { t } = useI18n();
  const [selected, setSelected] = useState<ExamMode>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(
    null
  );

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setProgress(null);

    // Generation is a single streaming request that can run for a couple of
    // minutes — on mobile Safari/Chrome, locking the screen or backgrounding
    // the tab kills the connection mid-stream (surfacing as an opaque "Load
    // failed"/network error), so hold a wake lock for the duration where the
    // API exists. Best-effort: unsupported browsers and denied locks just
    // no-op, they don't block generation.
    let wakeLock: { release: () => Promise<void> } | null = null;
    try {
      wakeLock = await navigator.wakeLock?.request("screen");
    } catch {
      // Ignore — e.g. not supported, or the page isn't visible yet.
    }

    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selected }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t.examModeSelector.genericError);
      }
      if (!res.body) throw new Error(t.examModeSelector.noResponseBody);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let examId: string | null = null;
      let doneCount = 0;
      let total = 1;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice("data: ".length));

          if (event.type === "start") {
            total = event.total;
            setProgress({ done: 0, total, label: t.examModeSelector.startingLabel });
          } else if (event.type === "section_done") {
            doneCount++;
            setProgress({ done: doneCount, total, label: event.section });
          } else if (event.type === "error") {
            throw new Error(event.message);
          } else if (event.type === "done") {
            examId = event.examId;
          }
        }
      }

      if (!examId) throw new Error(t.examModeSelector.generationEndedError);
      router.push(`/exams/${examId}`);
      router.refresh();
    } catch (err) {
      // A generic "Load failed"/"Failed to fetch" is the browser's wording
      // for the connection itself dying mid-stream (screen lock, backgrounded
      // tab, network switch) rather than anything the server reported —
      // surface that distinction instead of the opaque browser text.
      const message =
        err instanceof TypeError
          ? t.examModeSelector.connectionLostError
          : err instanceof Error
            ? err.message
            : t.common.somethingWrong;
      setError(message);
      setLoading(false);
      setProgress(null);
    } finally {
      wakeLock?.release().catch(() => {});
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
                  {t.examModeSelector.recommendedToday}
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

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? t.examModeSelector.generating : t.examModeSelector.generateBtn}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {loading && (
          <div className="max-w-sm space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: progress
                    ? `${Math.max(8, (progress.done / progress.total) * 100)}%`
                    : "8%",
                }}
              />
            </div>
            <p className="text-xs text-neutral-500">
              {progress
                ? progress.done >= progress.total
                  ? t.examModeSelector.savingLabel
                  : t.examModeSelector.progressLabel(progress.done, progress.total, progress.label)
                : t.examModeSelector.startingHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
