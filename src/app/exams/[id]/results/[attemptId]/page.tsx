import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { attemptId } = await params;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { parts: { include: { questions: true } } } },
      answers: true,
    },
  });

  if (!attempt) notFound();

  const answersByQuestionId = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const questions = attempt.exam.parts.flatMap((p) => p.questions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{attempt.exam.title} — Results</h1>
        <p className="mt-1 text-neutral-600">
          Score:{" "}
          {attempt.score !== null ? `${Math.round(attempt.score)}%` : "Not graded"}
        </p>
        {attempt.feedback && (
          <p className="mt-2 rounded-md bg-neutral-50 p-3 text-sm">
            {attempt.feedback}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const answer = answersByQuestionId.get(q.id);
          return (
            <div key={q.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-sm font-medium">
                {i + 1}. {q.prompt}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
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
                  Score: {Math.round(answer.scoreAwarded)}%
                </p>
              )}
              {answer?.feedback && (
                <p className="mt-1 text-sm text-neutral-600">{answer.feedback}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
