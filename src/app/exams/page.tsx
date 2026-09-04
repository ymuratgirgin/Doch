import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import GenerateExamButton from "@/components/GenerateExamButton";

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

  const exams = await prisma.exam.findMany({
    where: {
      OR: [{ attempts: { none: {} } }, { attempts: { some: { userId: user.id } } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { parts: true } },
      attempts: { where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exams</h1>
          <p className="mt-1 text-neutral-600">
            Generate a new Telc B1 mock exam or resume one below.
          </p>
        </div>
        <GenerateExamButton label="Generate full mock exam" />
      </div>

      {exams.length === 0 ? (
        <p className="rounded-md border border-neutral-200 bg-white px-4 py-6 text-center text-neutral-500">
          No exams yet. Generate one to get started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
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
  );
}
