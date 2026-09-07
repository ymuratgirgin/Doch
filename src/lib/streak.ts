import { prisma } from "@/lib/prisma";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Duolingo-style streak: consecutive calendar days with real practice —
// starting an exam attempt or reviewing a flashcard — counting back from
// today. Just having the site open (ActivitySession/heartbeat) does NOT
// count; that's tracked separately for the "time on site" stat only. Today
// not yet active doesn't break a streak still active as of yesterday, but
// any fully skipped day resets the count to 0 from that point.
export async function computeStreak(userId: string): Promise<number> {
  const [attempts, reviews] = await Promise.all([
    prisma.attempt.findMany({ where: { userId }, select: { startedAt: true } }),
    prisma.userVocabProgress.findMany({
      where: { userId, lastReviewedAt: { not: null } },
      select: { lastReviewedAt: true },
    }),
  ]);

  const activeDays = new Set<string>();
  for (const a of attempts) activeDays.add(dayKey(a.startedAt));
  for (const r of reviews) {
    if (r.lastReviewedAt) activeDays.add(dayKey(r.lastReviewedAt));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = activeDays.has(dayKey(today))
    ? today
    : new Date(today.getTime() - 86_400_000);

  let streak = 0;
  const c = new Date(cursor);
  while (activeDays.has(dayKey(c))) {
    streak++;
    c.setDate(c.getDate() - 1);
  }
  return streak;
}
