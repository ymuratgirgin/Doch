import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function MistakesPage() {
  const user = await requireUser();

  const wrongAnswers = await prisma.answer.findMany({
    where: {
      isCorrect: false,
      grammarTopic: { not: null },
      attempt: { userId: user.id },
    },
    include: { question: true },
    orderBy: { id: "desc" },
  });

  const vocabMistakes = await prisma.personalVocabWord.findMany({
    where: { userId: user.id, usageCorrect: false },
    orderBy: { lastSeenAt: "desc" },
  });

  const grouped = new Map<string, typeof wrongAnswers>();
  for (const a of wrongAnswers) {
    const topic = a.grammarTopic!;
    if (!grouped.has(topic)) grouped.set(topic, []);
    grouped.get(topic)!.push(a);
  }
  const groups = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-blue-900">Learn from Mistakes</h1>
        <p className="mt-1 text-neutral-600">
          Grouped by topic, most frequent first. Each explanation includes
          fresh examples — read them, don&apos;t just skim the rule.
        </p>
      </div>

      {groups.length === 0 && vocabMistakes.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          No mistakes recorded yet — take an exam to get started.
        </p>
      ) : (
        <>
          {groups.map(([topic, answers]) => (
            <section key={topic} className="space-y-3">
              <h2 className="text-lg font-semibold">
                {topic}{" "}
                <span className="text-sm font-normal text-neutral-500">
                  ({answers.length} time{answers.length === 1 ? "" : "s"})
                </span>
              </h2>
              {answers.map((a) => (
                <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-medium">{a.question.prompt}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Your answer: {a.responseText || <em>No answer</em>}
                    {a.question.correctAnswer && (
                      <> — correct: {a.question.correctAnswer}</>
                    )}
                  </p>
                  {a.grammarExplanation && (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                      {a.grammarExplanation}
                    </p>
                  )}
                </div>
              ))}
            </section>
          ))}

          {vocabMistakes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                Vocabulary usage mistakes{" "}
                <span className="text-sm font-normal text-neutral-500">
                  (from your writing answers)
                </span>
              </h2>
              {vocabMistakes.map((w) => (
                <div key={w.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <p className="text-sm font-medium">
                    {[w.article, w.word].filter(Boolean).join(" ")}
                  </p>
                  {w.usageNote && (
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                      {w.usageNote}
                    </p>
                  )}
                  {w.exampleSentence && (
                    <p className="mt-1 text-sm italic text-neutral-500">{w.exampleSentence}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
