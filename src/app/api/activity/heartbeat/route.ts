import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// A session is considered continuous if the previous heartbeat was less
// than this many minutes ago; otherwise a new ActivitySession starts.
const GAP_MINUTES = 5;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const cutoff = new Date(Date.now() - GAP_MINUTES * 60 * 1000);
  const recent = await prisma.activitySession.findFirst({
    where: { userId: user.id, lastSeenAt: { gte: cutoff } },
    orderBy: { lastSeenAt: "desc" },
  });

  if (recent) {
    await prisma.activitySession.update({
      where: { id: recent.id },
      data: { lastSeenAt: new Date() },
    });
  } else {
    await prisma.activitySession.create({ data: { userId: user.id } });
  }

  return NextResponse.json({ ok: true });
}
