import { prisma } from "@/lib/prisma";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Duolingo-style streak: consecutive calendar days with at least one
// ActivitySession, counting back from today. Today not yet active doesn't
// break a streak still active as of yesterday.
export async function computeStreak(userId: string): Promise<number> {
  const sessions = await prisma.activitySession.findMany({
    where: { userId },
    select: { startedAt: true, lastSeenAt: true },
  });

  const activeDays = new Set<string>();
  for (const s of sessions) {
    const cursor = new Date(s.startedAt);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(s.lastSeenAt);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      activeDays.add(dayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
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
