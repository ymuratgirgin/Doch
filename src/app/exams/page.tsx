import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/getLocale";
import { dictionaries } from "@/lib/i18n";
import { getDailyRecommendation } from "@/lib/recommendation";
import ExamModeSelector from "@/components/ExamModeSelector";
import ExamCountdown from "@/components/ExamCountdown";

export default async function ExamsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = dictionaries[locale];
  const MODE_LABELS = t.modeLabels;

  const [exams, recommendation] = await Promise.all([
    prisma.exam.findMany({
      where: {
        OR: [{ attempts: { none: {} } }, { attempts: { some: { userId: user.id } } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { parts: true } },
        attempts: { where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 1 },
      },
    }),
    getDailyRecommendation(user.id, user.examDate),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-blue-900">{t.examsPage.title}</h1>
        <p className="mt-1 text-neutral-600">{t.examsPage.subtitle}</p>
      </div>

      <ExamCountdown examDate={user.examDate?.toISOString() ?? null} />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <span className="font-medium">{t.examsPage.todaysRecommendation}</span>
        {recommendation.reason}
      </div>

      <ExamModeSelector
        defaultMode={recommendation.mode}
        options={[
          {
            mode: "full",
            title: t.examsPage.modeOptions.full.title,
            description: t.examsPage.modeOptions.full.desc,
            recommended: recommendation.mode === "full",
          },
          {
            mode: "reading",
            title: t.examsPage.modeOptions.reading.title,
            description: t.examsPage.modeOptions.reading.desc,
            recommended: recommendation.mode === "reading",
          },
          {
            mode: "listening",
            title: t.examsPage.modeOptions.listening.title,
            description: t.examsPage.modeOptions.listening.desc,
            recommended: recommendation.mode === "listening",
          },
          {
            mode: "writing",
            title: t.examsPage.modeOptions.writing.title,
            description: t.examsPage.modeOptions.writing.desc,
            recommended: recommendation.mode === "writing",
          },
          {
            mode: "grammar",
            title: t.examsPage.modeOptions.grammar.title,
            description: t.examsPage.modeOptions.grammar.desc,
            recommended: recommendation.mode === "grammar",
          },
          {
            mode: "speaking",
            title: t.examsPage.modeOptions.speaking.title,
            description: t.examsPage.modeOptions.speaking.desc,
          },
        ]}
      />

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          {t.examsPage.yourExams}
        </h2>
        {exams.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
            {t.examsPage.noExamsYet}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {exams.map((exam) => {
              const attempt = exam.attempts[0];
              return (
                <li key={exam.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <Link href={`/exams/${exam.id}`} className="font-medium hover:underline">
                      {exam.title}
                    </Link>
                    <div className="text-sm text-neutral-500">
                      {MODE_LABELS[exam.examMode] ?? exam.examMode} · {t.examsPage.partsCount(exam._count.parts)}
                      {" · "}
                      {attempt?.submittedAt
                        ? t.examsPage.scored(attempt.score ?? 0)
                        : attempt
                          ? t.examsPage.inProgress
                          : t.examsPage.notStarted}
                    </div>
                  </div>
                  <Link
                    href={
                      attempt?.submittedAt
                        ? `/exams/${exam.id}/results/${attempt.id}`
                        : `/exams/${exam.id}`
                    }
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
                  >
                    {attempt?.submittedAt ? t.examsPage.viewResults : t.examsPage.open}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
