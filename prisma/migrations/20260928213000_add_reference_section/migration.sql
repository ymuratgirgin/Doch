-- CreateTable
CREATE TABLE "ReferenceSection" (
    "id" TEXT NOT NULL,
    "examLabel" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "teil" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL,
    "answerKeyJson" TEXT,
    "spokenNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferenceSection_teil_idx" ON "ReferenceSection"("teil");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceSection_examLabel_teil_key" ON "ReferenceSection"("examLabel", "teil");
