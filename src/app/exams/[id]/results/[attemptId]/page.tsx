import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computePassEstimate } from "@/lib/passEstimate";
import type { WritingEvaluation } from "@/lib/examSchema";

const CRITERION_LABELS: Record<string, string> = {
  aufgabenbewaeltigung: "Aufgabenbewältigung",
  kommunikativeGestaltung: "Kommunikative Gestaltung",
  formaleRichtigkeit: "Formale Richtigkeit",
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { parts: { orderBy: { order: "asc" }, include: { questions: { orderBy: { order: "asc" } } } } } },
      answers: true,
    },
  });

  if (!attempt || attempt.userId !== user.id) notFound();

  const answersByQuestionId = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const passEstimate =
    attempt.exam.examMode === "full" && attempt.submittedAt
      ? await computePassEstimate(user.id)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{attempt.exam.title} — Results</h1>
        <p className="mt-1 text-neutral-600">
          Score:{" "}
          {attempt.score !== null ? `${Math.round(attempt.score)}%` : "Not graded"}
        </p>
      </div>

      {passEstimate && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            passEstimate.passing
              ? "border-green-300 bg-green-50 text-green-900"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium">
            Estimated pass likelihood: {passEstimate.estimatedProbability}%{" "}
            ({passEstimate.passing ? "currently passing" : "not yet passing"} the
            60% written threshold)
          </p>
          <p className="mt-1 text-xs opacity-80">
            Based on {passEstimate.basis}. This is a rough estimate from your
            written-skill scores only — the telc exam also requires ≥60% on
            the separately-graded speaking (mündlicher Ausdruck) component,
            which this app doesn&apos;t assess.
          </p>
        </div>
      )}

      {attempt.exam.parts.map((part) => (
        <div key={part.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{part.teilLabel ?? part.type}</h2>
          {part.questions.map((q, i) => {
            const answer = answersByQuestionId.get(q.id);
            const criteria: WritingEvaluation["criteria"] | null = answer?.criteriaJson
              ? JSON.parse(answer.criteriaJson)
              : null;

            return (
              <div key={q.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="text-sm font-medium">
                  {i + 1}. {q.prompt}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">
                  Your answer: {answer?.responseText || <em>No answer</em>}
                </p>

                {answer?.isCorrect !== null && answer?.isCorrect !== undefined && (
                  <p className={`mt-1 text-sm ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {answer.isCorrect ? "Correct" : "Incorrect"}
                    {!answer.isCorrect && q.correctAnswer && ` — expected: ${q.correctAnswer}`}
                  </p>
                )}

                {answer?.scoreAwarded !== null && answer?.scoreAwarded !== undefined && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {answer.scoreAwarded.toFixed(1)} / {q.maxPoints.toFixed(1)} points
                  </p>
                )}

                {criteria && (
                  <div className="mt-2 space-y-1 rounded-md bg-neutral-50 p-3 text-sm">
                    {Object.entries(criteria).map(([key, c]) => (
                      <p key={key}>
                        <span className="font-medium">{CRITERION_LABELS[key] ?? key}:</span>{" "}
                        {c.grade} — {c.explanation}
                      </p>
                    ))}
                  </div>
                )}

                {answer?.feedback && (
                  <p className="mt-2 text-sm text-neutral-600">{answer.feedback}</p>
                )}

                {answer?.grammarExplanation && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">{answer.grammarTopic}</p>
                    <p className="mt-1 whitespace-pre-wrap">{answer.grammarExplanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex gap-3">
        <Link
          href="/mistakes"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Review all past mistakes
        </Link>
      </div>
    </div>
  );
}
