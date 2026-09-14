import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/getLocale";
import { dictionaries } from "@/lib/i18n";
import { computePassEstimate } from "@/lib/passEstimate";
import { resolveMatchingAnswer } from "@/lib/matching";
import { getItemNumber, stripLeadingItemNumber } from "@/lib/examSchema";
import { parseWritingPrompt } from "@/lib/writingPrompt";
import ListeningPlayer from "@/components/ListeningPlayer";
const CRITERION_LABELS: Record<string, string> = {
  aufgabenbewaeltigung: "Aufgabenbewältigung",
  kommunikativeGestaltung: "Kommunikative Gestaltung",
  formaleRichtigkeit: "Formale Richtigkeit",
  ausdrucksfaehigkeit: "Ausdrucksfähigkeit",
};

type Criterion = { grade?: string; points?: number; explanation: string };

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const user = await requireUser();
  const { attemptId } = await params;
  const locale = await getLocale();
  const t = dictionaries[locale];

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
        <h1 className="text-2xl font-semibold">{attempt.exam.title} — {t.resultsPage.resultsSuffix}</h1>
        <p className="mt-1 text-neutral-600">{t.resultsPage.score(attempt.score)}</p>
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
            {t.resultsPage.passLikelihood(passEstimate.estimatedProbability, passEstimate.passing)}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {t.resultsPage.passBasisWritten(passEstimate.basis)}
          </p>
        </div>
      )}

      {attempt.exam.parts.map((part) => (
        <div key={part.id} className="space-y-3">
          <h2 className="text-lg font-semibold">{part.teilLabel ?? part.type}</h2>
          {part.type === "LISTENING" && part.passageText && (
            <ListeningPlayer script={part.passageText} teilLabel={part.teilLabel} unlimited />
          )}
          {part.questions.map((q, i) => {
            const answer = answersByQuestionId.get(q.id);
            const criteria: Record<string, Criterion> | null = answer?.criteriaJson
              ? JSON.parse(answer.criteriaJson)
              : null;

            // Real telc item number from the blueprint (spec §3.1-3.6),
            // not a locally-restarted index — Sprachbausteine prompts are
            // just the gap's number as text (e.g. "21"), so showing both
            // would duplicate it.
            const itemNumber = getItemNumber(part.teilLabel, i);
            const numberLabel =
              part.type === "GRAMMAR"
                ? `${itemNumber}.`
                : `${itemNumber}. ${stripLeadingItemNumber(q.prompt)}`;

            return (
              <div key={q.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                {part.type === "WRITING" ? (
                  (() => {
                    const { intro, points } = parseWritingPrompt(q.prompt);
                    return (
                      <div className="text-sm font-medium">
                        <p>{intro}</p>
                        {points.length > 0 && (
                          <ul className="mt-2 list-disc space-y-1 pl-5 font-normal">
                            {points.map((pt, idx) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm font-medium">{numberLabel}</p>
                )}
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">
                  {t.resultsPage.yourAnswer}
                  {answer?.responseText ? (
                    q.questionType === "matching"
                      ? resolveMatchingAnswer(answer.responseText, q.options)
                      : answer.responseText
                  ) : (
                    <em>{t.resultsPage.noAnswer}</em>
                  )}
                </p>

                {answer?.isCorrect !== null && answer?.isCorrect !== undefined && (
                  <p className={`mt-1 text-sm ${answer.isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {answer.isCorrect ? t.resultsPage.correct : t.resultsPage.incorrect}
                    {!answer.isCorrect &&
                      q.correctAnswer &&
                      t.resultsPage.expected(
                        q.questionType === "matching"
                          ? resolveMatchingAnswer(q.correctAnswer, q.options)
                          : q.correctAnswer
                      )}
                  </p>
                )}

                {answer?.scoreAwarded !== null && answer?.scoreAwarded !== undefined && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {t.resultsPage.pointsOf(answer.scoreAwarded, q.maxPoints)}
                  </p>
                )}

                {criteria && (
                  <div className="mt-2 space-y-1 rounded-md bg-neutral-50 p-3 text-sm">
                    {Object.entries(criteria).map(([key, c]) => (
                      <p key={key}>
                        <span className="font-medium">{CRITERION_LABELS[key] ?? key}:</span>{" "}
                        {c.grade ?? `${c.points} pts`} — {c.explanation}
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
          {t.resultsPage.reviewMistakes}
        </Link>
      </div>
    </div>
  );
}
