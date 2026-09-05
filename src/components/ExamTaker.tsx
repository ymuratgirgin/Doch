"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ListeningPlayer from "@/components/ListeningPlayer";
import SpeakingRecorder from "@/components/SpeakingRecorder";

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
  timeBudgetMinutes: number | null;
  parts: ExamPart[];
};

// Static exam-mechanics notes (ours, not model-generated) — shown once per
// relevant part type. General facts about the exam format, not sourced
// from any single learner's account.
const PART_TIPS: Record<string, string> = {
  LISTENING:
    "Tip: the first items in each Hörverstehen Teil are worth just as many points as the rest — get ready before you press play so you don't miss an easy one.",
  SPEAKING:
    "Tip: in the real paired exam, the examiner may end the conversation once they're confident in your level — that's normal, not a sign you did poorly.",
  WRITING:
    "Structure tip: Einleitung (1-2 sentences on why you're writing) → all 4 Leitpunkte, each with a connector (Zuerst, Außerdem, Des Weiteren, Schließlich) → Schluss (e.g. \"Ich freue mich auf Ihre/deine Antwort\"). This skeleton works for almost any telc B1 Schreiben task.",
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamTaker({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedScripts, setRevealedScripts] = useState<Record<string, boolean>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);

  function setResponse(questionId: string, value: string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  const handleSubmit = useCallback(
    async (idOverride?: string) => {
      const id = idOverride ?? attemptId;
      if (!id) return;
      setSubmitting(true);
      setError(null);
      try {
        const submitRes = await fetch(`/api/attempts/${id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: Object.entries(responses).map(([questionId, responseText]) => ({
              questionId,
              responseText,
            })),
          }),
        });
        const submitData = await submitRes.json();
        if (!submitRes.ok) throw new Error(submitData.error);

        router.push(`/exams/${exam.id}/results/${submitData.attemptId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptId, responses, exam.id]
  );

  useEffect(() => {
    async function startAttempt() {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start attempt");
        return;
      }
      setAttemptId(data.attemptId);
      if (exam.timeBudgetMinutes) {
        setDeadline(new Date(data.startedAt).getTime() + exam.timeBudgetMinutes * 60_000);
      }
    }
    void startAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const secondsLeft = Math.round((deadline - Date.now()) / 1000);
      setRemainingSeconds(Math.max(0, secondsLeft));
      if (secondsLeft <= 0 && !autoSubmittedRef.current && attemptId) {
        autoSubmittedRef.current = true;
        void handleSubmit();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, attemptId, handleSubmit]);

  const lowTime = remainingSeconds !== null && remainingSeconds <= 120;

  return (
    <div className="space-y-8">
      {remainingSeconds !== null && (
        <div
          className={`sticky top-0 z-10 rounded-md border px-4 py-2 text-sm font-medium ${
            lowTime
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-neutral-200 bg-white text-neutral-700"
          }`}
        >
          Time remaining: {formatClock(remainingSeconds)}
        </div>
      )}

      {exam.parts.map((part, partIndex) => {
        const isFirstOfType = exam.parts.findIndex((p) => p.type === part.type) === partIndex;
        return (
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
            {isFirstOfType && PART_TIPS[part.type] && (
              <p className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
                {PART_TIPS[part.type]}
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
                  {part.type === "SPEAKING" ? (
                    <div className="mt-2">
                      <SpeakingRecorder
                        value={responses[q.id] ?? ""}
                        onChange={(v) => setResponse(q.id, v)}
                      />
                    </div>
                  ) : options && q.questionType !== "free_text" ? (
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
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={() => handleSubmit()}
        disabled={submitting || !attemptId}
        className="rounded-md bg-orange-300 px-4 py-2 text-sm font-medium text-orange-950 hover:bg-orange-400 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit exam"}
      </button>
    </div>
  );
}
