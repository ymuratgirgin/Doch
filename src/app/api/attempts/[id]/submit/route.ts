import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { ANSWER_EVALUATION_PROMPT } from "@/lib/prompts";
import { recordVocabUsage } from "@/lib/personalVocab";
import {
  MISTAKE_EXPLANATION_INSTRUCTIONS,
  MistakeExplanation,
  WRITING_EVALUATION_INSTRUCTIONS,
  WritingEvaluation,
  extractJson,
  scoreWriting,
} from "@/lib/examSchema";

type SubmittedAnswer = { questionId: string; responseText: string };

async function callModel(system: string, userMessage: string, maxTokens: number) {
  const response = await anthropic.messages.create({
    model: EXAM_GENERATION_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  try {
    return extractJson(textBlock.text);
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

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
  if (attempt.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const questionsById = new Map(
    attempt.exam.parts.flatMap((p) => p.questions).map((q) => [q.id, q])
  );

  type Graded = {
    questionId: string;
    responseText: string;
    isCorrect: boolean | null;
    scoreAwarded: number | null;
    feedback: string | null;
    grammarTopic: string | null;
    grammarExplanation: string | null;
    criteriaJson: string | null;
  };
  const graded: Graded[] = [];
  const wrongForExplanation: { questionId: string; prompt: string; correctAnswer: string; learnerAnswer: string }[] = [];
  const freeTextAnswers: { questionId: string; prompt: string; responseText: string; maxPoints: number }[] = [];

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question) continue;

    if (question.questionType === "free_text") {
      freeTextAnswers.push({
        questionId: answer.questionId,
        prompt: question.prompt,
        responseText: answer.responseText,
        maxPoints: question.maxPoints,
      });
      continue;
    }

    const isCorrect =
      !!question.correctAnswer &&
      answer.responseText.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    graded.push({
      questionId: answer.questionId,
      responseText: answer.responseText,
      isCorrect,
      scoreAwarded: isCorrect ? question.maxPoints : 0,
      feedback: null,
      grammarTopic: null,
      grammarExplanation: null,
      criteriaJson: null,
    });

    if (!isCorrect) {
      wrongForExplanation.push({
        questionId: answer.questionId,
        prompt: question.prompt,
        correctAnswer: question.correctAnswer ?? "",
        learnerAnswer: answer.responseText,
      });
    }
  }

  // Explain every wrong objective answer: rule + fresh examples, cached
  // on the Answer so the mistake-review page never regenerates it.
  if (wrongForExplanation.length > 0 && process.env.ANTHROPIC_API_KEY) {
    const result = await callModel(
      ANSWER_EVALUATION_PROMPT,
      [
        "Explain these mistakes for the mistake-review page:",
        JSON.stringify(wrongForExplanation, null, 2),
        MISTAKE_EXPLANATION_INSTRUCTIONS,
      ].join("\n\n"),
      4000
    );
    const explanations = (Array.isArray(result) ? result : []) as MistakeExplanation[];
    const byId = new Map(explanations.map((e) => [e.questionId, e]));
    for (const g of graded) {
      const e = byId.get(g.questionId);
      if (e) {
        g.grammarTopic = e.grammarTopic;
        g.grammarExplanation = e.grammarExplanation;
      }
    }
  }

  // Writing (and any other free-text) answers: rubric grading + vocab
  // extraction into the learner's personal vocabulary bank.
  for (const fa of freeTextAnswers) {
    if (!process.env.ANTHROPIC_API_KEY) {
      graded.push({
        questionId: fa.questionId,
        responseText: fa.responseText,
        isCorrect: null,
        scoreAwarded: null,
        feedback: null,
        grammarTopic: null,
        grammarExplanation: null,
        criteriaJson: null,
      });
      continue;
    }

    const result = await callModel(
      ANSWER_EVALUATION_PROMPT,
      [
        "Grade this writing answer against the task:",
        `Task: ${fa.prompt}`,
        `Learner's answer: ${fa.responseText}`,
        WRITING_EVALUATION_INSTRUCTIONS,
      ].join("\n\n"),
      4000
    );

    const evaluation = result as WritingEvaluation | null;
    if (!evaluation) {
      graded.push({
        questionId: fa.questionId,
        responseText: fa.responseText,
        isCorrect: null,
        scoreAwarded: null,
        feedback: "Automatic grading failed for this answer — please retry.",
        grammarTopic: null,
        grammarExplanation: null,
        criteriaJson: null,
      });
      continue;
    }

    const rubricScore = scoreWriting(evaluation); // 0-45
    const scoreAwarded = (rubricScore / 45) * fa.maxPoints;

    graded.push({
      questionId: fa.questionId,
      responseText: fa.responseText,
      isCorrect: null,
      scoreAwarded,
      feedback: evaluation.overallFeedback,
      grammarTopic: null,
      grammarExplanation: null,
      criteriaJson: JSON.stringify(evaluation.criteria),
    });

    if (evaluation.vocabularyUsed?.length) {
      await recordVocabUsage(user.id, evaluation.vocabularyUsed);
    }
  }

  await prisma.$transaction(
    graded.map((g) =>
      prisma.answer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: g.questionId } },
        create: { attemptId, ...g },
        update: g,
      })
    )
  );

  const allMaxPoints = [...questionsById.values()]
    .filter((q) => graded.some((g) => g.questionId === q.id))
    .reduce((sum, q) => sum + q.maxPoints, 0);
  const allScores = graded.reduce((sum, g) => sum + (g.scoreAwarded ?? 0), 0);
  const overallScore = allMaxPoints > 0 ? (allScores / allMaxPoints) * 100 : null;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      score: overallScore,
    },
  });

  return NextResponse.json({ attemptId });
}
