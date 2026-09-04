import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const exams = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { parts: true, attempts: true } } },
  });
  return NextResponse.json(exams);
}
