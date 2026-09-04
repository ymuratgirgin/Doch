-- CreateEnum
CREATE TYPE "ExamPartType" AS ENUM ('READING', 'LISTENING', 'WRITING', 'GRAMMAR', 'SPEAKING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wordType" TEXT,
    "article" TEXT,
    "translation" TEXT,
    "exampleSentence" TEXT,
    "level" TEXT NOT NULL DEFAULT 'B1',
    "source" TEXT,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVocabProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabWordId" TEXT,
    "personalVocabWordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "boxLevel" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVocabProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalVocabWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wordType" TEXT,
    "article" TEXT,
    "translation" TEXT,
    "exampleSentence" TEXT,
    "usageCorrect" BOOLEAN NOT NULL DEFAULT true,
    "usageNote" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 1,
    "addedManually" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalVocabWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'B1',
    "examMode" TEXT NOT NULL DEFAULT 'full',
    "timeBudgetMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL DEFAULT 'llm',
    "promptSpec" TEXT,
    "focusAreas" TEXT,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamPart" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "type" "ExamPartType" NOT NULL,
    "teilLabel" TEXT,
    "order" INTEGER NOT NULL,
    "instructions" TEXT,
    "passageText" TEXT,

    CONSTRAINT "ExamPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examPartId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "grammarTopic" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "feedback" TEXT,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT,
    "isCorrect" BOOLEAN,
    "scoreAwarded" DOUBLE PRECISION,
    "feedback" TEXT,
    "grammarTopic" TEXT,
    "grammarExplanation" TEXT,
    "criteriaJson" TEXT,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "ActivitySession_userId_idx" ON "ActivitySession"("userId");

-- CreateIndex
CREATE INDEX "VocabWord_level_idx" ON "VocabWord"("level");

-- CreateIndex
CREATE INDEX "VocabWord_topic_idx" ON "VocabWord"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "VocabWord_word_wordType_level_key" ON "VocabWord"("word", "wordType", "level");

-- CreateIndex
CREATE INDEX "UserVocabProgress_userId_nextReviewAt_idx" ON "UserVocabProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabProgress_userId_vocabWordId_key" ON "UserVocabProgress"("userId", "vocabWordId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabProgress_userId_personalVocabWordId_key" ON "UserVocabProgress"("userId", "personalVocabWordId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalVocabWord_userId_word_wordType_key" ON "PersonalVocabWord"("userId", "word", "wordType");

-- CreateIndex
CREATE INDEX "ExamPart_examId_idx" ON "ExamPart"("examId");

-- CreateIndex
CREATE INDEX "Question_examPartId_idx" ON "Question"("examPartId");

-- CreateIndex
CREATE INDEX "Attempt_examId_idx" ON "Attempt"("examId");

-- CreateIndex
CREATE INDEX "Attempt_userId_idx" ON "Attempt"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabProgress" ADD CONSTRAINT "UserVocabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabProgress" ADD CONSTRAINT "UserVocabProgress_vocabWordId_fkey" FOREIGN KEY ("vocabWordId") REFERENCES "VocabWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabProgress" ADD CONSTRAINT "UserVocabProgress_personalVocabWordId_fkey" FOREIGN KEY ("personalVocabWordId") REFERENCES "PersonalVocabWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalVocabWord" ADD CONSTRAINT "PersonalVocabWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamPart" ADD CONSTRAINT "ExamPart_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examPartId_fkey" FOREIGN KEY ("examPartId") REFERENCES "ExamPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
