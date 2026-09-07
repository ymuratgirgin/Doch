/*
  Warnings:

  - You are about to drop the column `translation` on the `PersonalVocabWord` table. All the data in the column will be lost.
  - You are about to drop the column `translation` on the `VocabWord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PersonalVocabWord" DROP COLUMN "translation",
ADD COLUMN     "translationTr" TEXT;

-- AlterTable
ALTER TABLE "VocabWord" DROP COLUMN "translation",
ADD COLUMN     "translationTr" TEXT;
