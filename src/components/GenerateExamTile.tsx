"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExamMode } from "@/lib/examSchema";

export default function GenerateExamTile({
  mode,
  title,
  description,
  recommended,
}: {
  mode: ExamMode;
  title: string;
  description: string;
  recommended?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate exam");
      router.push(`/exams/${data.examId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`relative flex flex-col items-start gap-1 rounded-lg border bg-white p-4 text-left transition hover:shadow-sm disabled:opacity-60 ${
        recommended
          ? "border-blue-300 ring-1 ring-blue-200 hover:border-blue-400"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
          Recommended today
        </span>
      )}
      <span className="font-medium">{loading ? "Generating…" : title}</span>
      <span className="text-sm text-neutral-500">{description}</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </button>
  );
}
