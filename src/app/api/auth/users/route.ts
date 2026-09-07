import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[auth/users] failed:", err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 500 }
    );
  }
}
