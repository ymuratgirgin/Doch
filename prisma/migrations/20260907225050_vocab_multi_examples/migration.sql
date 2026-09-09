/*
  Warnings:

  - You are about to drop the column `exampleSentence` on the `VocabWord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VocabWord" DROP COLUMN "exampleSentence",
ADD COLUMN     "exampleSentences" TEXT[] DEFAULT ARRAY[]::TEXT[];
