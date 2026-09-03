import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { examId } = await req.json();
  if (!examId) {
    return NextResponse.json({ error: "examId is required" }, { status: 400 });
  }
  const attempt = await prisma.attempt.create({ data: { examId } });
  return NextResponse.json({ attemptId: attempt.id });
}
