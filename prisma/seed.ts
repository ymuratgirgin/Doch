// Seeds the shared VocabWord bank from data/B1_cleaned.json — 1,812 B1
// lemmas scraped from DWDS. That file has no translations or example
// sentences; those are filled in afterwards by scripts/enrich-vocab.ts.
// Safe to re-run: uses createMany with skipDuplicates.

import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

type SourceEntry = {
  lemma: string;
  pos: string | null;
  genders: string[];
  articles: string[];
  plural_only: boolean;
  alt_spellings: string[];
  homograph_index: number | null;
  source_url: string;
};

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

async function main() {
  const filePath = path.join(process.cwd(), "data", "B1_cleaned.json");
  const entries: SourceEntry[] = JSON.parse(readFileSync(filePath, "utf-8"));

  const rows = entries.map((e) => ({
    word: e.lemma,
    wordType: e.pos ? (POS_MAP[e.pos] ?? "other") : "other",
    article: e.articles[0] ?? null,
    level: "B1",
    source: "goethe-telc-dwds",
  }));

  // SQLite's driver adapter doesn't support createMany's skipDuplicates,
  // so upsert one row at a time (fine for ~1.8k rows against SQLite).
  const before = await prisma.vocabWord.count({ where: { level: "B1" } });
  for (const row of rows) {
    await prisma.vocabWord.upsert({
      where: {
        word_wordType_level: {
          word: row.word,
          wordType: row.wordType,
          level: row.level,
        },
      },
      create: row,
      update: {},
    });
  }
  const after = await prisma.vocabWord.count({ where: { level: "B1" } });

  console.log(`Upserted ${rows.length} vocab words (${after - before} newly created).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
