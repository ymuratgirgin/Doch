-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PersonalVocabWord" (
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
    "addedManually" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalVocabWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PersonalVocabWord" ("article", "exampleSentence", "firstSeenAt", "id", "lastSeenAt", "timesUsed", "translation", "usageCorrect", "usageNote", "userId", "word", "wordType") SELECT "article", "exampleSentence", "firstSeenAt", "id", "lastSeenAt", "timesUsed", "translation", "usageCorrect", "usageNote", "userId", "word", "wordType" FROM "PersonalVocabWord";
DROP TABLE "PersonalVocabWord";
ALTER TABLE "new_PersonalVocabWord" RENAME TO "PersonalVocabWord";
CREATE UNIQUE INDEX "PersonalVocabWord_userId_word_wordType_key" ON "PersonalVocabWord"("userId", "word", "wordType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
