import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const level = searchParams.get("level") ?? undefined;

  const words = await prisma.vocabWord.findMany({
    where: {
      level,
      ...(q ? { word: { contains: q } } : {}),
    },
    orderBy: { word: "asc" },
    take: 200,
  });

  return NextResponse.json(words);
}
