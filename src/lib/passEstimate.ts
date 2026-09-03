import { prisma } from "@/lib/prisma";

// telc B1 written pass threshold: ≥60% of 225 written points (spec §1).
// Speaking (mündlicher Ausdruck) isn't covered by this app and has its own
// independent ≥60% requirement — we only ever estimate the written half.
const WRITTEN_PASS_PERCENT = 60;
const SKILL_WEIGHTS: Record<string, number> = {
  reading: 75,
  grammar: 30,
  listening: 75,
  writing: 45,
};

export type PassEstimate = {
  percentage: number;
  passing: boolean;
  estimatedProbability: number; // 0-100, a rough heuristic, not statistical
  basis: string; // what data this was computed from
  coverage: "full_mock" | "partial_practice" | "none";
};

function estimateProbability(percentage: number): number {
  // Linear ramp centered on the 60% threshold — at 60% call it a coin
  // flip, ±2.5 points of probability per point of score either side.
  const raw = 50 + (percentage - WRITTEN_PASS_PERCENT) * 2.5;
  return Math.max(2, Math.min(98, Math.round(raw)));
}

export async function computePassEstimate(userId: string): Promise<PassEstimate | null> {
  const latestFullAttempt = await prisma.attempt.findFirst({
    where: { userId, exam: { examMode: "full" }, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    include: { answers: true, exam: { include: { parts: { include: { questions: true } } } } },
  });

  if (latestFullAttempt) {
    const questions = latestFullAttempt.exam.parts.flatMap((p) => p.questions);
    const maxPossible = questions.reduce((sum, q) => sum + q.maxPoints, 0);
    const raw = latestFullAttempt.answers.reduce((sum, a) => sum + (a.scoreAwarded ?? 0), 0);
    const percentage = maxPossible > 0 ? (raw / maxPossible) * 100 : 0;

    return {
      percentage,
      passing: percentage >= WRITTEN_PASS_PERCENT,
      estimatedProbability: estimateProbability(percentage),
      basis: `your most recent full mock exam (${new Date(latestFullAttempt.submittedAt!).toLocaleDateString()})`,
      coverage: "full_mock",
    };
  }

  // Fall back to combining the most recent single-skill practice attempts.
  const modes = Object.keys(SKILL_WEIGHTS);
  let weightedSum = 0;
  let weightCovered = 0;
  const covered: string[] = [];

  for (const mode of modes) {
    const attempt = await prisma.attempt.findFirst({
      where: { userId, exam: { examMode: mode }, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      include: { answers: true, exam: { include: { parts: { include: { questions: true } } } } },
    });
    if (!attempt) continue;

    const questions = attempt.exam.parts.flatMap((p) => p.questions);
    const maxPossible = questions.reduce((sum, q) => sum + q.maxPoints, 0);
    if (maxPossible === 0) continue;
    const raw = attempt.answers.reduce((sum, a) => sum + (a.scoreAwarded ?? 0), 0);
    const percentage = raw / maxPossible;

    const weight = SKILL_WEIGHTS[mode];
    weightedSum += percentage * weight;
    weightCovered += weight;
    covered.push(mode);
  }

  if (weightCovered === 0) return null;

  const percentage = (weightedSum / weightCovered) * 100;
  const totalWeight = Object.values(SKILL_WEIGHTS).reduce((a, b) => a + b, 0);
  const coverageNote =
    weightCovered < totalWeight
      ? ` (based on ${covered.join(", ")} practice only — take a full mock or the other skills for a fuller picture)`
      : " (based on your most recent practice in each skill)";

  return {
    percentage,
    passing: percentage >= WRITTEN_PASS_PERCENT,
    estimatedProbability: estimateProbability(percentage),
    basis: `your practice attempts so far${coverageNote}`,
    coverage: "partial_practice",
  };
}
