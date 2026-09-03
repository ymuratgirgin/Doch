-- CreateTable
CREATE TABLE "PersonalVocabWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wordType" TEXT,
    "article" TEXT,
    "translation" TEXT,
    "exampleSentence" TEXT,
    "usageCorrect" BOOLEAN NOT NULL DEFAULT true,
    "usageNote" TEXT,
    "timesUsed" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalVocabWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserVocabProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vocabWordId" TEXT,
    "personalVocabWordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "boxLevel" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" DATETIME,
    "nextReviewAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserVocabProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserVocabProgress_vocabWordId_fkey" FOREIGN KEY ("vocabWordId") REFERENCES "VocabWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserVocabProgress_personalVocabWordId_fkey" FOREIGN KEY ("personalVocabWordId") REFERENCES "PersonalVocabWord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserVocabProgress" ("boxLevel", "correctStreak", "id", "lastReviewedAt", "nextReviewAt", "status", "userId", "vocabWordId") SELECT "boxLevel", "correctStreak", "id", "lastReviewedAt", "nextReviewAt", "status", "userId", "vocabWordId" FROM "UserVocabProgress";
DROP TABLE "UserVocabProgress";
ALTER TABLE "new_UserVocabProgress" RENAME TO "UserVocabProgress";
CREATE INDEX "UserVocabProgress_userId_nextReviewAt_idx" ON "UserVocabProgress"("userId", "nextReviewAt");
CREATE UNIQUE INDEX "UserVocabProgress_userId_vocabWordId_key" ON "UserVocabProgress"("userId", "vocabWordId");
CREATE UNIQUE INDEX "UserVocabProgress_userId_personalVocabWordId_key" ON "UserVocabProgress"("userId", "personalVocabWordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PersonalVocabWord_userId_word_wordType_key" ON "PersonalVocabWord"("userId", "word", "wordType");
