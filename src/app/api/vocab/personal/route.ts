import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addManualWord } from "@/lib/personalVocab";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const words = await prisma.personalVocabWord.findMany({
    where: { userId: user.id },
    orderBy: { lastSeenAt: "desc" },
  });
  return NextResponse.json(words);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const word = typeof body.word === "string" ? body.word.trim() : "";
  if (!word) {
    return NextResponse.json({ error: "word is required" }, { status: 400 });
  }

  const saved = await addManualWord(user.id, {
    word,
    wordType: body.wordType,
    article: body.article,
    exampleSentence: body.exampleSentence,
  });

  return NextResponse.json(saved);
}
