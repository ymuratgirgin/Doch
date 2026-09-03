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
  const attempt = await prisma.attempt.create({
    data: { examId, userId: user.id },
  });
  return NextResponse.json({ attemptId: attempt.id });
}
