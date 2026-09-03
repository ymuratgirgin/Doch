"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ExamMode } from "@/lib/examSchema";

export default function GenerateExamTile({
  mode,
  title,
  description,
}: {
  mode: ExamMode;
  title: string;
  description: string;
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
      className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-400 hover:shadow-sm disabled:opacity-60"
    >
      <span className="font-medium">{loading ? "Generating…" : title}</span>
      <span className="text-sm text-neutral-500">{description}</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </button>
  );
}
