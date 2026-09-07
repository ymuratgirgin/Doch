"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ListeningPlayer from "@/components/ListeningPlayer";
import SpeakingRecorder from "@/components/SpeakingRecorder";
import { parseMatchingOption } from "@/lib/matching";
import { getItemNumber } from "@/lib/examSchema";
import { parseWritingPrompt } from "@/lib/writingPrompt";

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

// Sprachbausteine passages embed gap numbers inline, e.g. "...es geht (21)
// gut." The real exam prints a blank line under each number so it's
// obvious exactly where the missing word goes — reproduce that by
// underlining each "(NN)" marker instead of leaving it as plain text.
const GAP_MARKER = /(\(\d+\))/g;
const IS_GAP_MARKER = /^\(\d+\)$/;

function renderTextWithGapMarkers(text: string) {
  return text.split(GAP_MARKER).map((part, i) =>
    IS_GAP_MARKER.test(part) ? (
      <span
        key={i}
        className="border-b-2 border-blue-400 px-0.5 font-semibold text-blue-700"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type RenderBlock =
  | { kind: "matching"; options: string[]; situations: Question[] }
  | { kind: "single"; question: Question };

// telc matching Teile (Leseverstehen 1 & 3) repeat the identical a-l/a-j
// options list on every situation/question — group consecutive questions
// that share it so the ad/headline board renders once, not once per row.
function buildRenderBlocks(questions: Question[]): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  let i = 0;
  while (i < questions.length) {
    const q = questions[i];
    if (q.questionType === "matching" && q.options) {
      const group = [q];
      let j = i + 1;
      while (
        j < questions.length &&
        questions[j].questionType === "matching" &&
        questions[j].options === q.options
      ) {
        group.push(questions[j]);
        j++;
      }
      blocks.push({ kind: "matching", options: JSON.parse(q.options) as string[], situations: group });
      i = j;
      continue;
    }
    blocks.push({ kind: "single", question: q });
    i++;
  }
  return blocks;
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
            <p className="whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-sm leading-7">
              {renderTextWithGapMarkers(part.passageText)}
            </p>
          )}

          <div className="space-y-5">
            {(() => {
              let questionNumber = 0;
              return buildRenderBlocks(part.questions).map((block) => {
                if (block.kind === "matching") {
                  const parsedOptions = block.options.map(parseMatchingOption);
                  const startNumber = getItemNumber(part.teilLabel, questionNumber);
                  questionNumber += block.situations.length;
                  return (
                    <div key={block.situations[0].id} className="space-y-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {parsedOptions.map(({ letter, body }) => (
                          <div
                            key={letter}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm"
                          >
                            <span className="font-semibold uppercase text-blue-700">{letter})</span>
                            <p className="mt-1 whitespace-pre-line text-neutral-700">{body}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        {block.situations.map((q, idx) => (
                          <div key={q.id}>
                            <p className="text-sm font-medium">
                              {startNumber + idx}. {q.prompt}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {parsedOptions.map(({ letter }) => (
                                <button
                                  key={letter}
                                  type="button"
                                  onClick={() => setResponse(q.id, letter)}
                                  className={`h-11 min-w-11 rounded-md border px-2 text-sm font-medium uppercase ${
                                    responses[q.id] === letter
                                      ? "border-blue-400 bg-blue-100 text-blue-900"
                                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                                  }`}
                                >
                                  {letter}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                const q = block.question;
                const itemNumber = getItemNumber(part.teilLabel, questionNumber);
                questionNumber++;
                const options = q.options ? (JSON.parse(q.options) as string[]) : null;
                // Sprachbausteine prompts are just the gap's item number as
                // text (e.g. "21") — since we compute the real number
                // ourselves from the blueprint, showing the prompt too
                // would just duplicate it.
                const numberLabel =
                  part.type === "GRAMMAR" ? `${itemNumber}.` : `${itemNumber}. ${q.prompt}`;
                return (
                  <div key={q.id}>
                    {part.type === "WRITING" ? (
                      (() => {
                        const { intro, points } = parseWritingPrompt(q.prompt);
                        return (
                          <div className="text-sm font-medium">
                            <p>{intro}</p>
                            {points.length > 0 && (
                              <ul className="mt-2 list-disc space-y-1 pl-5 font-normal">
                                {points.map((pt, i) => (
                                  <li key={i}>{pt}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-sm font-medium">{numberLabel}</p>
                    )}
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
                          <label key={opt} className="flex min-h-11 items-center gap-2 py-1 text-sm">
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
              });
            })()}
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
