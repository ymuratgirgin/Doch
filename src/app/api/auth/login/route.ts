import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { name } = await req.json().catch(() => ({}));
  const trimmed = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";

  if (!trimmed || trimmed.length > 40) {
    return NextResponse.json(
      { error: "Please enter a name (max 40 characters)." },
      { status: 400 }
    );
  }

  // Match case-insensitively so "Murat", "murat", and "MURAT" all land on
  // the same account instead of silently forking into separate profiles —
  // the unique constraint on User.name is case-sensitive at the DB level,
  // so without this a typo in casing would look like data loss to the user.
  const existing = await prisma.user.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  const user = existing ?? (await prisma.user.create({ data: { name: trimmed } }));

  await createSession(user.id);

  return NextResponse.json({ userId: user.id });
}
