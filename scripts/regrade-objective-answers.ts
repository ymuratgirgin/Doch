// Recomputes isCorrect/scoreAwarded on already-submitted objective answers
// (multiple_choice/gap_fill/true_false/matching — not free_text) using the
// same normalized letter-prefix comparison as the live grading code. Fixes
// exams graded before that normalization existed, where a bare-letter
// "correctAnswer" (e.g. "b") never matched the learner's stored full-text
// answer (e.g. "b) Weil ihn ... fasziniert haben."), silently marking
// correct answers wrong. Safe to re-run — only writes when the recomputed
// value actually differs from what's stored.
//
// Usage: npx tsx scripts/regrade-objective-answers.ts
// Requires DATABASE_URL in the environment (.env is loaded).

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseMatchingOption } from "../src/lib/matching";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function isCorrectAnswer(responseText: string, correctAnswer: string): boolean {
  return (
    !!correctAnswer.trim() &&
    !!responseText.trim() &&
    parseMatchingOption(responseText.trim()).letter.toLowerCase() ===
      parseMatchingOption(correctAnswer.trim()).letter.toLowerCase()
  );
}

async function main() {
  const answers = await prisma.answer.findMany({
    where: {
      question: { questionType: { not: "free_text" } },
      responseText: { not: null },
    },
    include: { question: true },
  });

  let changed = 0;
  const affectedAttemptIds = new Set<string>();

  for (const a of answers) {
    if (!a.question.correctAnswer || !a.responseText) continue;
    const recomputed = isCorrectAnswer(a.responseText, a.question.correctAnswer);
    if (recomputed === a.isCorrect) continue;

    await prisma.answer.update({
      where: { id: a.id },
      data: {
        isCorrect: recomputed,
        scoreAwarded: recomputed ? a.question.maxPoints : 0,
      },
    });
    changed++;
    affectedAttemptIds.add(a.attemptId);
  }

  console.log(`Recomputed ${changed} answer(s) across ${affectedAttemptIds.size} attempt(s).`);

  for (const attemptId of affectedAttemptIds) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { answers: { include: { question: true } } },
    });
    if (!attempt?.submittedAt) continue;

    const allMaxPoints = attempt.answers.reduce((sum, a) => sum + a.question.maxPoints, 0);
    const allScores = attempt.answers.reduce((sum, a) => sum + (a.scoreAwarded ?? 0), 0);
    const overallScore = allMaxPoints > 0 ? (allScores / allMaxPoints) * 100 : null;

    await prisma.attempt.update({ where: { id: attemptId }, data: { score: overallScore } });
    console.log(`Attempt ${attemptId}: new score ${overallScore?.toFixed(1) ?? "n/a"}%`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
