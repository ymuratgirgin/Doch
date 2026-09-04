import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { name } = await req.json().catch(() => ({}));
  const trimmed = typeof name === "string" ? name.trim() : "";

  if (!trimmed || trimmed.length > 40) {
    return NextResponse.json(
      { error: "Please enter a name (max 40 characters)." },
      { status: 400 }
    );
  }

  const user = await prisma.user.upsert({
    where: { name: trimmed },
    create: { name: trimmed },
    update: {},
  });

  await createSession(user.id);

  return NextResponse.json({ userId: user.id });
}
