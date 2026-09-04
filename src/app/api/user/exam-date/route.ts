import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { examDate } = await req.json().catch(() => ({}));
  const parsed = examDate ? new Date(examDate) : null;
  if (examDate && (!parsed || Number.isNaN(parsed.getTime()))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { examDate: parsed },
  });

  return NextResponse.json({ examDate: parsed });
}
