import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computeStreak } from "@/lib/streak";
import { getDailyRecommendation } from "@/lib/recommendation";
import GenerateExamTile from "@/components/GenerateExamTile";
import ExamCountdown from "@/components/ExamCountdown";

export default async function DashboardPage() {
  const user = await requireUser();

  const [vocabCount, attemptCount, streak, recommendation] = await Promise.all([
    prisma.vocabWord.count(),
    prisma.attempt.count({ where: { userId: user.id, submittedAt: { not: null } } }),
    computeStreak(user.id),
    getDailyRecommendation(user.id, user.examDate),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Willkommen, {user.name}</h1>
          <p className="mt-1 text-neutral-600">
            Practice for the telc B1 German exam with fresh, LLM-generated
            mock exams and instant feedback.
          </p>
        </div>
        {streak > 0 && (
          <div className="rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-800">
            🔥 {streak} day{streak === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <ExamCountdown examDate={user.examDate?.toISOString() ?? null} />

      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <span className="font-medium">Today&apos;s recommendation: </span>
        {recommendation.reason}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Practice
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <GenerateExamTile
            mode="full"
            title="Complete Mock Exam"
            description="Full telc B1 exam — Lesen, Sprachbausteine, Hören, Schreiben"
            recommended={recommendation.mode === "full"}
          />
          <GenerateExamTile
            mode="reading"
            title="Reading"
            description="Leseverstehen Teil 1–3"
            recommended={recommendation.mode === "reading"}
          />
          <GenerateExamTile
            mode="listening"
            title="Listening"
            description="Hörverstehen Teil 1–3, read aloud in-browser"
            recommended={recommendation.mode === "listening"}
          />
          <GenerateExamTile
            mode="writing"
            title="Writing"
            description="Schriftlicher Ausdruck — reply email"
            recommended={recommendation.mode === "writing"}
          />
          <GenerateExamTile
            mode="grammar"
            title="Grammar"
            description="Sprachbausteine Teil 1–2"
            recommended={recommendation.mode === "grammar"}
          />
          <GenerateExamTile
            mode="speaking"
            title="Speaking"
            description="Mündlicher Ausdruck, solo-adapted — speak or type your answer"
          />
          <Link
            href="/flashcards"
            className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 hover:shadow-sm"
          >
            <span className="font-medium">Flash Cards</span>
            <span className="text-sm text-neutral-500">
              Review vocabulary, prioritized by what you need most
            </span>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
          Review
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mistakes"
            className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 hover:shadow-sm"
          >
            <span className="font-medium">Review your previous mistakes</span>
            <span className="text-sm text-neutral-500">
              Grouped explanations with fresh examples
            </span>
          </Link>
          <Link
            href="/progress"
            className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 hover:shadow-sm"
          >
            <span className="font-medium">Review your progress</span>
            <span className="text-sm text-neutral-500">
              Time spent, exams taken, words learned, pass likelihood
            </span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Vocabulary words available" value={vocabCount} />
        <StatCard label="Exams you've completed" value={attemptCount} />
      </div>

      {vocabCount === 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No vocabulary is loaded yet. Run the seed script to import the B1
          word list.
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
