import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { ANSWER_EVALUATION_PROMPT } from "@/lib/prompts";
import {
  EVALUATION_JSON_INSTRUCTIONS,
  EvaluationResult,
  extractJson,
} from "@/lib/examSchema";

type SubmittedAnswer = { questionId: string; responseText: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: attemptId } = await params;
  const { answers }: { answers: SubmittedAnswer[] } = await req.json();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { parts: { include: { questions: true } } } },
    },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const questionsById = new Map(
    attempt.exam.parts.flatMap((p) => p.questions).map((q) => [q.id, q])
  );

  const autoGraded: {
    questionId: string;
    responseText: string;
    isCorrect: boolean;
    scoreAwarded: number;
  }[] = [];
  const needsLlmGrading: { questionId: string; responseText: string }[] = [];

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) continue;

    if (question.correctAnswer && question.questionType !== "free_text") {
      const isCorrect =
        answer.responseText.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase();
      autoGraded.push({
        questionId: answer.questionId,
        responseText: answer.responseText,
        isCorrect,
        scoreAwarded: isCorrect ? 100 : 0,
      });
    } else {
      needsLlmGrading.push(answer);
    }
  }

  let llmResult: EvaluationResult | null = null;
  if (needsLlmGrading.length > 0 && process.env.ANTHROPIC_API_KEY) {
    const userMessage = [
      "Evaluate these learner answers:",
      JSON.stringify(
        needsLlmGrading.map((a) => ({
          questionId: a.questionId,
          question: questionsById.get(a.questionId)?.prompt,
          learnerAnswer: a.responseText,
        })),
        null,
        2
      ),
      EVALUATION_JSON_INSTRUCTIONS,
    ].join("\n\n");

    const response = await anthropic.messages.create({
      model: EXAM_GENERATION_MODEL,
      max_tokens: 4000,
      system: ANSWER_EVALUATION_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      try {
        llmResult = extractJson(textBlock.text) as EvaluationResult;
      } catch {
        llmResult = null;
      }
    }
  }

  const llmScoresById = new Map(
    (llmResult?.answers ?? []).map((a) => [a.questionId, a])
  );

  await prisma.$transaction([
    ...autoGraded.map((a) =>
      prisma.answer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId: a.questionId },
        },
        create: {
          attemptId,
          questionId: a.questionId,
          responseText: a.responseText,
          isCorrect: a.isCorrect,
          scoreAwarded: a.scoreAwarded,
        },
        update: {
          responseText: a.responseText,
          isCorrect: a.isCorrect,
          scoreAwarded: a.scoreAwarded,
        },
      })
    ),
    ...needsLlmGrading.map((a) => {
      const graded = llmScoresById.get(a.questionId);
      return prisma.answer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId: a.questionId },
        },
        create: {
          attemptId,
          questionId: a.questionId,
          responseText: a.responseText,
          scoreAwarded: graded?.scoreAwarded ?? null,
          feedback: graded?.feedback ?? null,
        },
        update: {
          responseText: a.responseText,
          scoreAwarded: graded?.scoreAwarded ?? null,
          feedback: graded?.feedback ?? null,
        },
      });
    }),
  ]);

  const allScores = [
    ...autoGraded.map((a) => a.scoreAwarded),
    ...needsLlmGrading
      .map((a) => llmScoresById.get(a.questionId)?.scoreAwarded)
      .filter((s): s is number => typeof s === "number"),
  ];
  const overallScore =
    allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : null;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      score: overallScore,
      feedback: llmResult?.overallFeedback ?? null,
    },
  });

  return NextResponse.json({ attemptId });
}
