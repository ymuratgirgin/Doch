import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [vocabCount, examCount, attemptCount] = await Promise.all([
    prisma.vocabWord.count(),
    prisma.exam.count(),
    prisma.attempt.count({ where: { submittedAt: { not: null } } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Telc B1 Trainer</h1>
        <p className="mt-1 text-neutral-600">
          Generate fresh Telc B1 mock exams and get instant, LLM-graded
          feedback on your answers.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Vocabulary words" value={vocabCount} />
        <StatCard label="Exams generated" value={examCount} />
        <StatCard label="Exams completed" value={attemptCount} />
      </div>

      <div className="flex gap-3">
        <Link
          href="/exams"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Start a mock exam
        </Link>
        <Link
          href="/vocab"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Browse vocabulary
        </Link>
      </div>

      {vocabCount === 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No vocabulary is loaded yet. Import your Telc/Goethe B1 word list
          to give exam generation real material to draw on.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
