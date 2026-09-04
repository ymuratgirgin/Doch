import { prisma } from "@/lib/prisma";
import type { ExamMode } from "@/lib/examSchema";

export type DailyRecommendation = { mode: ExamMode; reason: string };

const PRACTICE_MODES: ExamMode[] = ["reading", "listening", "writing", "grammar"];
const MODE_LABELS: Record<ExamMode, string> = {
  full: "a Complete Mock Exam",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  grammar: "Grammar",
  speaking: "Speaking",
};

export async function getDailyRecommendation(
  userId: string,
  examDate: Date | null
): Promise<DailyRecommendation> {
  if (examDate) {
    const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / 86_400_000);
    if (daysLeft >= 0 && daysLeft <= 14) {
      return {
        mode: "full",
        reason: `Your exam is in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — simulate real conditions with a full mock.`,
      };
    }
  }

  const scores: { mode: ExamMode; avg: number }[] = [];
  for (const mode of PRACTICE_MODES) {
    const attempts = await prisma.attempt.findMany({
      where: { userId, exam: { examMode: mode }, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      take: 3,
      select: { score: true },
    });
    if (attempts.length === 0) continue;
    const avg = attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attempts.length;
    scores.push({ mode, avg });
  }

  if (scores.length === 0) {
    return {
      mode: "full",
      reason: "Take a full mock exam to see where you stand and get a personalized starting point.",
    };
  }

  scores.sort((a, b) => a.avg - b.avg);
  const weakest = scores[0];
  return {
    mode: weakest.mode,
    reason: `${MODE_LABELS[weakest.mode]} is your lowest-scoring skill (${Math.round(weakest.avg)}% recently) — a good place to focus today.`,
  };
}
