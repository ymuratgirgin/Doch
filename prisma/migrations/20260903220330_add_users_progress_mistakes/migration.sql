/*
  Warnings:

  - Added the required column `userId` to the `Attempt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN "criteriaJson" TEXT;
ALTER TABLE "Answer" ADD COLUMN "grammarExplanation" TEXT;
ALTER TABLE "Answer" ADD COLUMN "grammarTopic" TEXT;

-- AlterTable
ALTER TABLE "ExamPart" ADD COLUMN "teilLabel" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivitySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserVocabProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vocabWordId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "boxLevel" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" DATETIME,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserVocabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserVocabProgress_vocabWordId_fkey" FOREIGN KEY ("vocabWordId") REFERENCES "VocabWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "score" REAL,
    "feedback" TEXT,
    CONSTRAINT "Attempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attempt" ("examId", "feedback", "id", "score", "startedAt", "submittedAt") SELECT "examId", "feedback", "id", "score", "startedAt", "submittedAt" FROM "Attempt";
DROP TABLE "Attempt";
ALTER TABLE "new_Attempt" RENAME TO "Attempt";
CREATE INDEX "Attempt_examId_idx" ON "Attempt"("examId");
CREATE INDEX "Attempt_userId_idx" ON "Attempt"("userId");
CREATE TABLE "new_Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'B1',
    "examMode" TEXT NOT NULL DEFAULT 'full',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL DEFAULT 'llm',
    "promptSpec" TEXT,
    "focusAreas" TEXT
);
INSERT INTO "new_Exam" ("createdAt", "generatedBy", "id", "level", "promptSpec", "title") SELECT "createdAt", "generatedBy", "id", "level", "promptSpec", "title" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examPartId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT,
    "maxPoints" REAL NOT NULL DEFAULT 1,
    "grammarTopic" TEXT,
    CONSTRAINT "Question_examPartId_fkey" FOREIGN KEY ("examPartId") REFERENCES "ExamPart" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("correctAnswer", "examPartId", "id", "options", "order", "prompt", "questionType") SELECT "correctAnswer", "examPartId", "id", "options", "order", "prompt", "questionType" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE INDEX "Question_examPartId_idx" ON "Question"("examPartId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "ActivitySession_userId_idx" ON "ActivitySession"("userId");

-- CreateIndex
CREATE INDEX "UserVocabProgress_userId_nextReviewAt_idx" ON "UserVocabProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabProgress_userId_vocabWordId_key" ON "UserVocabProgress"("userId", "vocabWordId");
