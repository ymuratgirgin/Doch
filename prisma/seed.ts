// Seeds the shared VocabWord bank from data/B1_cleaned.json — 1,812 B1
// lemmas scraped from DWDS, curated with a Turkish translation and two
// German example sentences per word. Safe to re-run: upserts by the
// (word, wordType, level) unique key, so it both adds new words and syncs
// updated content (a corrected translation, say) into already-seeded rows.

import { readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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
  meaning?: string | null;
  translationTr?: string | null;
  exampleSentences?: string[];
  plural?: string | null;
  pastParticiple?: string | null;
  auxiliaryVerb?: string | null;
  praeteritum?: string | null;
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
    meaning: e.meaning ?? null,
    translationTr: e.translationTr ?? null,
    exampleSentences: e.exampleSentences ?? [],
    plural: e.plural ?? null,
    pastParticiple: e.pastParticiple ?? null,
    auxiliaryVerb: e.auxiliaryVerb ?? null,
    praeteritum: e.praeteritum ?? null,
  }));

  const CONCURRENCY = 20;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map((row) =>
        prisma.vocabWord.upsert({
          where: { word_wordType_level: { word: row.word, wordType: row.wordType, level: row.level } },
          create: row,
          update: row,
        })
      )
    );
    console.log(`Synced ${Math.min(i + CONCURRENCY, rows.length)} / ${rows.length}...`);
  }

  console.log(`Done. Synced ${rows.length} vocab words from source.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
