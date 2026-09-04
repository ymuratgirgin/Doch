import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { examId } = await req.json();
  if (!examId) {
    return NextResponse.json({ error: "examId is required" }, { status: 400 });
  }

  // Reuse an in-progress attempt for this exam so a page reload doesn't
  // restart the countdown timer or orphan an attempt.
  const existing = await prisma.attempt.findFirst({
    where: { examId, userId: user.id, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const attempt =
    existing ?? (await prisma.attempt.create({ data: { examId, userId: user.id } }));

  return NextResponse.json({ attemptId: attempt.id, startedAt: attempt.startedAt });
}
