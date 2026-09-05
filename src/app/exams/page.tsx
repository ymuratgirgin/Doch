import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getDailyRecommendation } from "@/lib/recommendation";
import ExamModeSelector from "@/components/ExamModeSelector";
import ExamCountdown from "@/components/ExamCountdown";

const MODE_LABELS: Record<string, string> = {
  full: "Complete Mock Exam",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  grammar: "Grammar",
  speaking: "Speaking",
};

export default async function ExamsPage() {
  const user = await requireUser();

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
        <h1 className="text-2xl font-semibold text-blue-900">Mock Exam</h1>
        <p className="mt-1 text-neutral-600">
          Pick an exam type, generate it, and take it whenever you&apos;re ready.
        </p>
      </div>

      <ExamCountdown examDate={user.examDate?.toISOString() ?? null} />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <span className="font-medium">Today&apos;s recommendation: </span>
        {recommendation.reason}
      </div>

      <ExamModeSelector
        defaultMode={recommendation.mode}
        options={[
          {
            mode: "full",
            title: "Complete Mock Exam",
            description: "Full telc B1 exam — Lesen, Sprachbausteine, Hören, Schreiben",
            recommended: recommendation.mode === "full",
          },
          {
            mode: "reading",
            title: "Reading",
            description: "Leseverstehen Teil 1–3",
            recommended: recommendation.mode === "reading",
          },
          {
            mode: "listening",
            title: "Listening",
            description: "Hörverstehen Teil 1–3, read aloud in-browser",
            recommended: recommendation.mode === "listening",
          },
          {
            mode: "writing",
            title: "Writing",
            description: "Schriftlicher Ausdruck — reply email",
            recommended: recommendation.mode === "writing",
          },
          {
            mode: "grammar",
            title: "Grammar",
            description: "Sprachbausteine Teil 1–2",
            recommended: recommendation.mode === "grammar",
          },
          {
            mode: "speaking",
            title: "Speaking",
            description: "Mündlicher Ausdruck, solo-adapted — speak or type your answer",
          },
        ]}
      />

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Your exams
        </h2>
        {exams.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
            No exams yet. Generate one above to get started.
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
                      {MODE_LABELS[exam.examMode] ?? exam.examMode} · {exam._count.parts} parts
                      {attempt?.submittedAt ? ` · scored ${Math.round(attempt.score ?? 0)}%` : attempt ? " · in progress" : " · not started"}
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
                    {attempt?.submittedAt ? "View results" : "Open"}
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
