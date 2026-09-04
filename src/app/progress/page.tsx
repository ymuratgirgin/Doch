import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computePassEstimate } from "@/lib/passEstimate";
import { computeStreak } from "@/lib/streak";
import ExamCountdown from "@/components/ExamCountdown";
import ScoreTrendChart from "@/components/ScoreTrendChart";

const MODE_LABELS: Record<string, string> = {
  full: "Complete Mock Exams",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  grammar: "Grammar",
  speaking: "Speaking",
};

const TREND_MODES: { mode: string; label: string }[] = [
  { mode: "reading", label: "Reading" },
  { mode: "listening", label: "Listening" },
  { mode: "writing", label: "Writing" },
  { mode: "grammar", label: "Grammar" },
];

export default async function ProgressPage() {
  const user = await requireUser();

  const [sessions, attempts, vocabCounts, passEstimate, streak, trendData] = await Promise.all([
    prisma.activitySession.findMany({ where: { userId: user.id } }),
    prisma.attempt.findMany({
      where: { userId: user.id, submittedAt: { not: null } },
      include: { exam: { select: { examMode: true } } },
    }),
    prisma.userVocabProgress.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    }),
    computePassEstimate(user.id),
    computeStreak(user.id),
    Promise.all(
      TREND_MODES.map(async ({ mode, label }) => {
        const recent = await prisma.attempt.findMany({
          where: { userId: user.id, exam: { examMode: mode }, submittedAt: { not: null } },
          orderBy: { submittedAt: "desc" },
          take: 8,
          select: { score: true },
        });
        return { mode, label, scores: recent.reverse().map((a) => a.score ?? 0) };
      })
    ),
  ]);

  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.lastSeenAt.getTime() - s.startedAt.getTime()) / 60_000,
    0
  );

  const attemptsByMode = new Map<string, number>();
  for (const a of attempts) {
    const mode = a.exam.examMode;
    attemptsByMode.set(mode, (attemptsByMode.get(mode) ?? 0) + 1);
  }

  const knownCount = vocabCounts.find((v) => v.status === "known")?._count ?? 0;
  const learningCount = vocabCounts.find((v) => v.status === "learning")?._count ?? 0;
  const totalTracked = vocabCounts.reduce((sum, v) => sum + v._count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your progress</h1>
          <p className="mt-1 text-neutral-600">{user.name}</p>
        </div>
        {streak > 0 && (
          <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-800">
            🔥 {streak} day{streak === 1 ? "" : "s"} streak
          </div>
        )}
      </div>

      <ExamCountdown examDate={user.examDate?.toISOString() ?? null} />

      {passEstimate && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            passEstimate.passing
              ? "border-green-300 bg-green-50 text-green-900"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium">
            Estimated pass likelihood: {passEstimate.estimatedProbability}% —{" "}
            {passEstimate.percentage.toFixed(0)}% on the written portion
            ({passEstimate.passing ? "≥60%, currently passing" : "below the 60% threshold"})
          </p>
          <p className="mt-1 text-xs opacity-80">
            Based on {passEstimate.basis}. Written-skills only — speaking
            isn&apos;t assessed by this app but is graded independently.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Time on site" value={formatMinutes(totalMinutes)} />
        <StatCard label="Exams completed" value={String(attempts.length)} />
        <StatCard label="Words known" value={`${knownCount} / ${totalTracked}`} />
      </div>

      <div>
        <h2 className="mb-2 font-medium">Score trend</h2>
        <ScoreTrendChart data={trendData} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium">Exams by type</h2>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          {Object.entries(MODE_LABELS).map(([mode, label]) => (
            <li key={mode} className="flex justify-between">
              <span>{label}</span>
              <span>{attemptsByMode.get(mode) ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-medium">Vocabulary</h2>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li className="flex justify-between">
            <span>Known</span>
            <span>{knownCount}</span>
          </li>
          <li className="flex justify-between">
            <span>Learning</span>
            <span>{learningCount}</span>
          </li>
          <li className="flex justify-between">
            <span>Total tracked</span>
            <span>{totalTracked}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}
