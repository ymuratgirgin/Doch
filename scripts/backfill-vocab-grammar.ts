// Backfills meaning/plural/pastParticiple/auxiliaryVerb/praeteritum onto
// VocabWord rows that were already seeded before these fields existed in
// data/B1_cleaned.json. Safe to re-run — it just re-applies the JSON's
// current values.
//
// Usage: npx tsx scripts/backfill-vocab-grammar.ts
// Requires DATABASE_URL in the environment (.env is loaded).

import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const POS_MAP: Record<string, string> = {
  Substantiv: "noun",
  Verb: "verb",
  Adjektiv: "adjective",
  Adverb: "adverb",
  "partizipiales Adjektiv": "participle_adjective",
  Konjunktion: "conjunction",
  Pronominaladverb: "pronominal_adverb",
  Demonstrativpronomen: "demonstrative_pronoun",
  Präposition: "preposition",
  Indefinitpronomen: "indefinite_pronoun",
  Komparativ: "comparative",
  Partikel: "particle",
  Eigenname: "proper_noun",
  Interjektion: "interjection",
  Mehrwortausdruck: "phrase",
};

type SourceEntry = {
  lemma: string;
  pos: string | null;
  meaning?: string | null;
  plural?: string | null;
  pastParticiple?: string | null;
  auxiliaryVerb?: string | null;
  praeteritum?: string | null;
};

async function main() {
  const filePath = path.join(process.cwd(), "data", "B1_cleaned.json");
  const entries: SourceEntry[] = JSON.parse(readFileSync(filePath, "utf-8"));

  let updated = 0;
  for (const e of entries) {
    if (!e.meaning) continue;
    const wordType = e.pos ? (POS_MAP[e.pos] ?? "other") : "other";
    const result = await prisma.vocabWord.updateMany({
      where: { word: e.lemma, wordType, level: "B1" },
      data: {
        meaning: e.meaning,
        plural: e.plural ?? null,
        pastParticiple: e.pastParticiple ?? null,
        auxiliaryVerb: e.auxiliaryVerb ?? null,
        praeteritum: e.praeteritum ?? null,
      },
    });
    updated += result.count;
  }

  console.log(`Backfilled grammar/meaning fields on ${updated} VocabWord rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
