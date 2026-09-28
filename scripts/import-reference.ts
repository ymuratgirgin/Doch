// Loads private reference material from the git-ignored reference/ folder
// into the database: reference exams (one JSON file per exam in
// reference/exams/ -> ReferenceSection) and extra vocabulary lists (one JSON
// file per list in reference/vocab/ -> VocabWord). The live app never reads
// the folder — Vercel doesn't deploy ignored files — so this script is how
// the material reaches the database. Safe to re-run: exam rows are upserted
// by (examLabel, teil) and vocabulary rows by (word, wordType, level), so an
// unchanged file changes nothing.
//
// Usage: npx tsx scripts/import-reference.ts [--dry-run] [--dir <folder>] [--vocab-dir <folder>]
//   --dry-run    validate the files and report, without touching the database
//   --dir        folder with the exam files (default: reference/exams)
//   --vocab-dir  folder with the vocabulary files (default: reference/vocab)
// Requires DATABASE_URL in the environment (.env is loaded), except --dry-run.
//
// File format (reference/exams/<examLabel>.json):
//   {
//     "examLabel": "book-uebungstest-2",       // lowercase letters, digits, "-"
//     "source": "telc-pdf" | "prep-book",
//     "sections": [
//       {
//         "teil": "lesen-1",                    // see TEIL_SHAPES below
//         "content": { ... },                   // shape per teil, see below
//         "answerKey": { "1": "c", ... },       // optional; "+"/"-" for listening, "x" = no ad
//         "spokenNotes": "..."                  // optional, hoeren-* only, our own words
//       }
//     ]
//   }
//
// content shape per teil (all keys required, extra keys allowed):
//   lesen-1           headings {a: text}, texts {"1": text}
//   lesen-2           title, text, questions [{n, stem, options {a, b, c}}]
//   lesen-3           situations {"11": text}, ads {a: text}
//   sprachbausteine-1 text (gaps written as [21]), options {"21": {a, b, c}}
//   sprachbausteine-2 text (gaps written as [31]), words {a: WORT}
//   hoeren-1..3       statements {"41": text}, transcript (string or null)
//   schreiben         email, points [text]
//   sprechen-1        instructions, topics [text]
//   sprechen-2        instructions, topic, cards {A: {text, author}, B: {text, author}}
//   sprechen-3        scenario, checklist [text], steps [text]
// Only text is stored; audio and PDFs are never uploaded.

import "dotenv/config";
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SOURCES = ["telc-pdf", "prep-book"];

type Kind = "object" | "string" | "array" | "string|null";

const TEIL_SHAPES: Record<string, Record<string, Kind>> = {
  "lesen-1": { headings: "object", texts: "object" },
  "lesen-2": { title: "string", text: "string", questions: "array" },
  "lesen-3": { situations: "object", ads: "object" },
  "sprachbausteine-1": { text: "string", options: "object" },
  "sprachbausteine-2": { text: "string", words: "object" },
  "hoeren-1": { statements: "object", transcript: "string|null" },
  "hoeren-2": { statements: "object", transcript: "string|null" },
  "hoeren-3": { statements: "object", transcript: "string|null" },
  schreiben: { email: "string", points: "array" },
  "sprechen-1": { instructions: "string", topics: "array" },
  "sprechen-2": { instructions: "string", topic: "string", cards: "object" },
  "sprechen-3": { scenario: "string", checklist: "array", steps: "array" },
};

type Section = {
  teil: string;
  content: Record<string, unknown>;
  answerKey?: Record<string, string>;
  spokenNotes?: string;
};

type ExamFile = { examLabel: string; source: string; sections: Section[] };

function kindOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function validate(file: string, data: unknown): ExamFile {
  const fail = (msg: string): never => {
    throw new Error(`${file}: ${msg}`);
  };
  if (kindOf(data) !== "object") fail("top level must be an object");
  const exam = data as Record<string, unknown>;
  if (typeof exam.examLabel !== "string" || !/^[a-z0-9-]+$/.test(exam.examLabel)) {
    fail('"examLabel" must be a string of lowercase letters, digits and "-"');
  }
  if (typeof exam.source !== "string" || !SOURCES.includes(exam.source)) {
    fail(`"source" must be one of ${SOURCES.join(", ")}`);
  }
  if (!Array.isArray(exam.sections) || exam.sections.length === 0) {
    fail('"sections" must be a non-empty array');
  }
  const seen = new Set<string>();
  for (const raw of exam.sections as unknown[]) {
    if (kindOf(raw) !== "object") fail("every section must be an object");
    const section = raw as Record<string, unknown>;
    const teil = section.teil;
    if (typeof teil !== "string" || !(teil in TEIL_SHAPES)) {
      fail(`unknown "teil" ${JSON.stringify(teil)}; allowed: ${Object.keys(TEIL_SHAPES).join(", ")}`);
    }
    const label = teil as string;
    if (seen.has(label)) fail(`teil "${label}" appears twice`);
    seen.add(label);
    if (kindOf(section.content) !== "object") fail(`${label}: "content" must be an object`);
    const content = section.content as Record<string, unknown>;
    for (const [key, kind] of Object.entries(TEIL_SHAPES[label])) {
      const actual = kindOf(content[key]);
      const ok = kind === "string|null" ? actual === "string" || actual === "null" : actual === kind;
      if (!ok) fail(`${label}: content.${key} must be ${kind} (found ${actual})`);
    }
    if (section.answerKey !== undefined) {
      const key = section.answerKey;
      if (kindOf(key) !== "object" || Object.values(key as object).some((v) => typeof v !== "string")) {
        fail(`${label}: "answerKey" must map item numbers to strings`);
      }
    }
    if (section.spokenNotes !== undefined) {
      if (typeof section.spokenNotes !== "string") fail(`${label}: "spokenNotes" must be a string`);
      if (!label.startsWith("hoeren-")) fail(`${label}: "spokenNotes" is only for hoeren-* sections`);
    }
  }
  return exam as unknown as ExamFile;
}

// --- Vocabulary lists ---------------------------------------------------------
// File format (reference/vocab/<name>.json):
//   {
//     "source": "einfach-gut-b1",   // stored in VocabWord.source, marks the batch
//     "level": "B1",
//     "words": [{
//       "word": "Abflug", "article": "der" | null, "wordType": "noun",
//       "plural": "Abflüge" | null, "meaning": "...", "translationTr": "...",
//       "exampleSentences": ["...", "..."],
//       "pastParticiple"?, "auxiliaryVerb"?, "praeteritum"?   // verbs only
//     }]
//   }
// Rows are added next to the shared bank (seeded from data/B1_cleaned.json).
// A word that is already in the bank under another source is skipped and
// never overwritten; only rows carrying this file's own source are updated.

const WORD_TYPES = [
  "noun", "verb", "adjective", "adverb", "phrase", "proper_noun", "conjunction", "preposition",
  "indefinite_pronoun", "demonstrative_pronoun", "pronominal_adverb", "participle_adjective",
  "comparative", "particle", "interjection", "other",
];

type VocabWordInput = {
  word: string;
  article: string | null;
  wordType: string;
  plural: string | null;
  meaning: string;
  translationTr: string;
  exampleSentences: string[];
  pastParticiple?: string;
  auxiliaryVerb?: string;
  praeteritum?: string;
};

type VocabFile = { source: string; level: string; words: VocabWordInput[] };

function validateVocab(file: string, data: unknown): VocabFile {
  const fail = (msg: string): never => {
    throw new Error(`${file}: ${msg}`);
  };
  if (kindOf(data) !== "object") fail("top level must be an object");
  const list = data as Record<string, unknown>;
  if (typeof list.source !== "string" || !/^[a-z0-9-]+$/.test(list.source)) {
    fail('"source" must be a string of lowercase letters, digits and "-"');
  }
  if (typeof list.level !== "string" || !/^[A-C][12]$/.test(list.level)) fail('"level" must be like "B1"');
  if (!Array.isArray(list.words) || list.words.length === 0) fail('"words" must be a non-empty array');
  const seen = new Set<string>();
  for (const raw of list.words as unknown[]) {
    if (kindOf(raw) !== "object") fail("every word must be an object");
    const w = raw as Record<string, unknown>;
    const label = String(w.word);
    if (typeof w.word !== "string" || w.word.trim() === "") fail("a word has no text");
    if (typeof w.wordType !== "string" || !WORD_TYPES.includes(w.wordType)) {
      fail(`${label}: unknown wordType ${JSON.stringify(w.wordType)}`);
    }
    const key = `${w.word}|${w.wordType}`;
    if (seen.has(key)) fail(`${label}: appears twice with the same wordType`);
    seen.add(key);
    for (const field of ["meaning", "translationTr"] as const) {
      if (typeof w[field] !== "string" || (w[field] as string).trim() === "") fail(`${label}: "${field}" is required`);
    }
    const ex = w.exampleSentences;
    if (!Array.isArray(ex) || ex.length !== 2 || ex.some((e) => typeof e !== "string" || e.trim() === "")) {
      fail(`${label}: "exampleSentences" must be exactly two sentences`);
    }
    for (const field of ["article", "plural"] as const) {
      if (w[field] !== null && w[field] !== undefined && typeof w[field] !== "string") {
        fail(`${label}: "${field}" must be a string or null`);
      }
    }
    if (w.wordType === "noun" && !w.article) fail(`${label}: a noun needs an article`);
    const verbForms = ["pastParticiple", "auxiliaryVerb", "praeteritum"].filter((k) => w[k] !== undefined);
    if (w.wordType === "verb") {
      if (verbForms.length !== 3) fail(`${label}: a verb needs pastParticiple, auxiliaryVerb and praeteritum`);
      if (w.auxiliaryVerb !== "haben" && w.auxiliaryVerb !== "sein") fail(`${label}: auxiliaryVerb must be haben or sein`);
    } else if (verbForms.length > 0) {
      fail(`${label}: only verbs carry verb forms`);
    }
  }
  return list as unknown as VocabFile;
}

function vocabData(file: VocabFile, w: VocabWordInput) {
  return {
    article: w.article || null,
    plural: w.plural || null,
    meaning: w.meaning,
    translationTr: w.translationTr,
    exampleSentences: w.exampleSentences,
    pastParticiple: w.pastParticiple ?? null,
    auxiliaryVerb: w.auxiliaryVerb ?? null,
    praeteritum: w.praeteritum ?? null,
    source: file.source,
  };
}

async function importVocab(prisma: PrismaClient, files: VocabFile[]) {
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  for (const file of files) {
    const bank = await prisma.vocabWord.findMany({ where: { level: file.level } });
    const byKey = new Map(bank.map((r) => [`${r.word}|${r.wordType}`, r]));
    const lemmas = new Set(bank.map((r) => r.word.toLowerCase()));
    const toCreate: (ReturnType<typeof vocabData> & { word: string; wordType: string; level: string })[] = [];
    for (const w of file.words) {
      const data = vocabData(file, w);
      const existing = byKey.get(`${w.word}|${w.wordType}`);
      if (existing && existing.source === file.source) {
        const same =
          existing.article === data.article &&
          existing.plural === data.plural &&
          existing.meaning === data.meaning &&
          existing.translationTr === data.translationTr &&
          JSON.stringify(existing.exampleSentences) === JSON.stringify(data.exampleSentences) &&
          existing.pastParticiple === data.pastParticiple &&
          existing.auxiliaryVerb === data.auxiliaryVerb &&
          existing.praeteritum === data.praeteritum;
        if (same) {
          unchanged++;
        } else {
          await prisma.vocabWord.update({ where: { id: existing.id }, data });
          updated++;
        }
      } else if (existing || lemmas.has(w.word.toLowerCase())) {
        skipped++; // already in the bank from another source: never overwritten
      } else {
        toCreate.push({ ...data, word: w.word, wordType: w.wordType, level: file.level });
      }
    }
    if (toCreate.length > 0) {
      const result = await prisma.vocabWord.createMany({ data: toCreate, skipDuplicates: true });
      created += result.count;
    }
  }
  console.log(`Vocabulary: ${created} created, ${updated} updated, ${unchanged} unchanged, ${skipped} skipped (already in the bank).`);
}

function jsonFiles(dir: string): string[] {
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .sort()
    : [];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const flag = (name: string, fallback: string) => {
    const i = args.indexOf(name);
    return path.resolve(i >= 0 ? args[i + 1] : fallback);
  };
  const dir = flag("--dir", path.join("reference", "exams"));
  const vocabDir = flag("--vocab-dir", path.join("reference", "vocab"));

  const examFiles = jsonFiles(dir);
  const vocabFiles = jsonFiles(vocabDir);
  if (examFiles.length === 0 && vocabFiles.length === 0) {
    console.log(`No .json files in ${dir} or ${vocabDir} — nothing to import.`);
    return;
  }

  const exams = examFiles.map((f) => validate(f, JSON.parse(readFileSync(path.join(dir, f), "utf-8"))));
  const labels = exams.map((e) => e.examLabel);
  if (new Set(labels).size !== labels.length) throw new Error("Two files use the same examLabel.");
  const vocab = vocabFiles.map((f) => validateVocab(f, JSON.parse(readFileSync(path.join(vocabDir, f), "utf-8"))));

  if (dryRun) {
    for (const exam of exams) {
      console.log(`OK  ${exam.examLabel} (${exam.source}): ${exam.sections.map((s) => s.teil).join(", ")}`);
    }
    for (const list of vocab) {
      console.log(`OK  vocabulary ${list.source} (${list.level}): ${list.words.length} words`);
    }
    console.log("Dry run: nothing written.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    if (exams.length > 0) {
      let created = 0;
      let updated = 0;
      let unchanged = 0;
      for (const exam of exams) {
        for (const section of exam.sections) {
          const data = {
            source: exam.source,
            contentJson: JSON.stringify(section.content),
            answerKeyJson: section.answerKey ? JSON.stringify(section.answerKey) : null,
            spokenNotes: section.spokenNotes ?? null,
          };
          const where = { examLabel_teil: { examLabel: exam.examLabel, teil: section.teil } };
          const existing = await prisma.referenceSection.findUnique({ where });
          if (!existing) {
            await prisma.referenceSection.create({
              data: { examLabel: exam.examLabel, teil: section.teil, ...data },
            });
            created++;
          } else if (
            existing.source === data.source &&
            existing.contentJson === data.contentJson &&
            existing.answerKeyJson === data.answerKeyJson &&
            existing.spokenNotes === data.spokenNotes
          ) {
            unchanged++;
          } else {
            await prisma.referenceSection.update({ where, data });
            updated++;
          }
        }
      }
      console.log(`Exams: ${created} created, ${updated} updated, ${unchanged} unchanged.`);
    }
    if (vocab.length > 0) await importVocab(prisma, vocab);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
