import { prisma } from "@/lib/prisma";

export type WeakArea = { grammarTopic: string; missCount: number };

// Top grammar topics this user has recently gotten wrong, most frequent
// first. Used both to bias new exam generation (spec §7) and to power the
// mistake-review page.
export async function getUserWeakAreas(userId: string, limit = 5): Promise<WeakArea[]> {
  const wrongAnswers = await prisma.answer.findMany({
    where: {
      isCorrect: false,
      grammarTopic: { not: null },
      attempt: { userId },
    },
    select: { grammarTopic: true },
  });

  const counts = new Map<string, number>();
  for (const a of wrongAnswers) {
    if (!a.grammarTopic) continue;
    counts.set(a.grammarTopic, (counts.get(a.grammarTopic) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([grammarTopic, missCount]) => ({ grammarTopic, missCount }))
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, limit);
}
