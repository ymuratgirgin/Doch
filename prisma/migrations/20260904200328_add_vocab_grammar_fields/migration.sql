-- AlterTable
ALTER TABLE "PersonalVocabWord" ADD COLUMN     "auxiliaryVerb" TEXT,
ADD COLUMN     "meaning" TEXT,
ADD COLUMN     "pastParticiple" TEXT,
ADD COLUMN     "plural" TEXT,
ADD COLUMN     "praeteritum" TEXT;

-- AlterTable
ALTER TABLE "VocabWord" ADD COLUMN     "auxiliaryVerb" TEXT,
ADD COLUMN     "meaning" TEXT,
ADD COLUMN     "pastParticiple" TEXT,
ADD COLUMN     "plural" TEXT,
ADD COLUMN     "praeteritum" TEXT;
