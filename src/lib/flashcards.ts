import { prisma } from "@/lib/prisma";

export type FlashCard = {
  progressId: string;
  word: string;
  wordType: string | null;
  article: string | null;
  exampleSentence: string | null;
  status: string;
  boxLevel: number;
  reason: string; // why this card was prioritized, shown to the learner
};

const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;
const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

function intervalForBox(box: number): number {
  return BOX_INTERVAL_DAYS[Math.min(Math.max(box, 0), MAX_BOX)];
}

function scoreAndReason(row: {
  status: string;
  nextReviewAt: Date;
  personalVocabWordId: string | null;
  personalUsageCorrect?: boolean | null;
  personalTimesUsed?: number | null;
  personalAddedManually?: boolean | null;
  personalFirstSeenAt?: Date | null;
}): { score: number; reason: string } {
  const now = Date.now();
  const overdueDays = Math.max(0, (now - row.nextReviewAt.getTime()) / 86_400_000);
  let score = 0;
  const reasons: string[] = [];

  if (row.status === "new") {
    score += 50;
    reasons.push("new word");
  }
  if (row.nextReviewAt.getTime() <= now) {
    score += 100 + Math.min(overdueDays, 30) * 2;
    reasons.push("due for review");
  }
  if (row.personalVocabWordId) {
    if (row.personalUsageCorrect === false) {
      score += 200;
      reasons.unshift("you used this incorrectly in a past answer");
    }
    if (row.personalTimesUsed) {
      score += Math.min(row.personalTimesUsed, 10) * 5;
      if (row.personalTimesUsed > 1) reasons.push(`used ${row.personalTimesUsed}x in your exams`);
    }
    if (row.personalAddedManually && row.personalFirstSeenAt) {
      const ageDays = (now - row.personalFirstSeenAt.getTime()) / 86_400_000;
      if (ageDays < 3) {
        score += 40;
        reasons.push("freshly added");
      }
    }
  }

  return { score, reason: reasons[0] ?? "review" };
}

export async function getStudyQueue(userId: string, limit = 20): Promise<FlashCard[]> {
  // Bring any never-studied global words into scope as "new" candidates.
  const freshGlobalWords = await prisma.vocabWord.findMany({
    where: { level: "B1", progress: { none: { userId } } },
    take: 100,
  });
  if (freshGlobalWords.length > 0) {
    try {
      await prisma.userVocabProgress.createMany({
        data: freshGlobalWords.map((w) => ({ userId, vocabWordId: w.id })),
      });
    } catch {
      // Rare race (e.g. a concurrent call already inserted some of these) —
      // fall back to one-by-one upserts instead of failing the whole queue.
      for (const w of freshGlobalWords) {
        await prisma.userVocabProgress.upsert({
          where: { userId_vocabWordId: { userId, vocabWordId: w.id } },
          create: { userId, vocabWordId: w.id },
          update: {},
        });
      }
    }
  }

  const rows = await prisma.userVocabProgress.findMany({
    where: { userId },
    include: { vocabWord: true, personalVocabWord: true },
    take: 500,
  });

  const scored = rows.map((row) => {
    const { score, reason } = scoreAndReason({
      status: row.status,
      nextReviewAt: row.nextReviewAt,
      personalVocabWordId: row.personalVocabWordId,
      personalUsageCorrect: row.personalVocabWord?.usageCorrect,
      personalTimesUsed: row.personalVocabWord?.timesUsed,
      personalAddedManually: row.personalVocabWord?.addedManually,
      personalFirstSeenAt: row.personalVocabWord?.firstSeenAt,
    });
    const source = row.vocabWord ?? row.personalVocabWord;
    return { row, score, reason, source };
  });

  return scored
    .filter((s) => s.score > 0 && s.source)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row, reason, source }) => ({
      progressId: row.id,
      word: source!.word,
      wordType: source!.wordType,
      article: source!.article,
      exampleSentence: source!.exampleSentence,
      status: row.status,
      boxLevel: row.boxLevel,
      reason,
    }));
}

export async function recordReview(userId: string, progressId: string, knew: boolean) {
  const progress = await prisma.userVocabProgress.findUnique({ where: { id: progressId } });
  if (!progress || progress.userId !== userId) throw new Error("Not found");

  const newBox = knew ? Math.min(progress.boxLevel + 1, MAX_BOX) : Math.max(progress.boxLevel - 1, 0);
  const status = knew && newBox >= 3 ? "known" : "learning";
  const nextReviewAt = new Date(Date.now() + intervalForBox(newBox) * 86_400_000);

  await prisma.userVocabProgress.update({
    where: { id: progressId },
    data: {
      boxLevel: newBox,
      status,
      correctStreak: knew ? progress.correctStreak + 1 : 0,
      lastReviewedAt: new Date(),
      nextReviewAt,
    },
  });
}
