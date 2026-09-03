"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ListeningPlayer from "@/components/ListeningPlayer";

type Question = {
  id: string;
  prompt: string;
  questionType: string;
  options: string | null;
};

type ExamPart = {
  id: string;
  type: string;
  teilLabel: string | null;
  instructions: string | null;
  passageText: string | null;
  questions: Question[];
};

type Exam = {
  id: string;
  title: string;
  parts: ExamPart[];
};

export default function ExamTaker({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedScripts, setRevealedScripts] = useState<Record<string, boolean>>({});

  function setResponse(questionId: string, value: string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const attemptRes = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id }),
      });
      const attemptData = await attemptRes.json();
      if (!attemptRes.ok) throw new Error(attemptData.error);

      const submitRes = await fetch(
        `/api/attempts/${attemptData.attemptId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: Object.entries(responses).map(
              ([questionId, responseText]) => ({ questionId, responseText })
            ),
          }),
        }
      );
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error);

      router.push(`/exams/${exam.id}/results/${submitData.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {exam.parts.map((part) => (
        <section
          key={part.id}
          className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5"
        >
          <div>
            <h2 className="text-lg font-semibold">{part.teilLabel ?? part.type}</h2>
            {part.instructions && (
              <p className="mt-1 text-sm text-neutral-600">
                {part.instructions}
              </p>
            )}
          </div>

          {part.passageText && part.type === "LISTENING" && (
            <div className="space-y-2">
              <ListeningPlayer script={part.passageText} teilLabel={part.teilLabel} />
              {revealedScripts[part.id] ? (
                <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-sm">
                  {part.passageText}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setRevealedScripts((prev) => ({ ...prev, [part.id]: true }))
                  }
                  className="text-xs text-neutral-500 underline hover:text-neutral-800"
                >
                  Show script (only after listening, for review)
                </button>
              )}
            </div>
          )}

          {part.passageText && part.type !== "LISTENING" && (
            <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-sm">
              {part.passageText}
            </p>
          )}

          <div className="space-y-5">
            {part.questions.map((q, i) => {
              const options = q.options ? (JSON.parse(q.options) as string[]) : null;
              return (
                <div key={q.id}>
                  <p className="text-sm font-medium">
                    {i + 1}. {q.prompt}
                  </p>
                  {options && q.questionType !== "free_text" ? (
                    <div className="mt-2 space-y-1">
                      {options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={q.id}
                            value={opt}
                            checked={responses[q.id] === opt}
                            onChange={() => setResponse(q.id, opt)}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      rows={q.questionType === "free_text" ? 8 : 1}
                      value={responses[q.id] ?? ""}
                      onChange={(e) => setResponse(q.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit exam"}
      </button>
    </div>
  );
}
