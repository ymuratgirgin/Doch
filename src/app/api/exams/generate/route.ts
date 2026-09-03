import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { EXAM_GENERATION_PROMPT } from "@/lib/prompts";
import {
  EXAM_JSON_INSTRUCTIONS,
  GeneratedExam,
  extractJson,
} from "@/lib/examSchema";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const level: string = body.level ?? "B1";

  const vocabSample = await prisma.vocabWord.findMany({
    where: { level },
    take: 60,
  });

  const vocabList = vocabSample
    .map((w) =>
      [w.article, w.word].filter(Boolean).join(" ") +
      (w.translation ? ` — ${w.translation}` : "")
    )
    .join("\n");

  const userMessage = [
    vocabList
      ? `Here is a sample of the level-${level} vocabulary bank to draw on:\n${vocabList}`
      : `No vocabulary bank is loaded yet for level ${level}; use standard Telc B1 vocabulary.`,
    EXAM_JSON_INSTRUCTIONS,
  ].join("\n\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const response = await anthropic.messages.create({
    model: EXAM_GENERATION_MODEL,
    max_tokens: 8000,
    system: EXAM_GENERATION_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "Model returned no text content." },
      { status: 502 }
    );
  }

  let generated: GeneratedExam;
  try {
    generated = extractJson(textBlock.text) as GeneratedExam;
  } catch {
    return NextResponse.json(
      { error: "Failed to parse generated exam JSON.", raw: textBlock.text },
      { status: 502 }
    );
  }

  const exam = await prisma.exam.create({
    data: {
      title: generated.title ?? `Telc B1 Mock Exam`,
      level,
      generatedBy: "llm",
      promptSpec: EXAM_GENERATION_PROMPT,
      parts: {
        create: generated.parts.map((part, partIndex) => ({
          type: part.type,
          order: partIndex,
          instructions: part.instructions,
          passageText: part.passageText,
          questions: {
            create: part.questions.map((q, qIndex) => ({
              order: qIndex,
              prompt: q.prompt,
              questionType: q.questionType,
              options: q.options ? JSON.stringify(q.options) : null,
              correctAnswer: q.correctAnswer ?? null,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ examId: exam.id });
}
