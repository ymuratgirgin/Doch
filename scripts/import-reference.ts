// Loads private reference exams into the ReferenceSection table from the
// git-ignored reference/ folder (one JSON file per exam in reference/exams/).
// The live app never reads the folder — Vercel doesn't deploy ignored files —
// so this script is how reference text reaches the database. Safe to re-run:
// rows are upserted by (examLabel, teil), so an unchanged file changes nothing.
//
// Usage: npx tsx scripts/import-reference.ts [--dry-run] [--dir <folder>]
//   --dry-run  validate the files and report, without touching the database
//   --dir      folder with the exam files (default: reference/exams)
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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const dirFlag = args.indexOf("--dir");
  const dir = path.resolve(dirFlag >= 0 ? args[dirFlag + 1] : path.join("reference", "exams"));

  if (!existsSync(dir)) {
    console.log(`No folder at ${dir} — nothing to import.`);
    return;
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    console.log(`No .json exam files in ${dir} — nothing to import.`);
    return;
  }

  const exams = files.map((f) => validate(f, JSON.parse(readFileSync(path.join(dir, f), "utf-8"))));
  const labels = exams.map((e) => e.examLabel);
  if (new Set(labels).size !== labels.length) throw new Error("Two files use the same examLabel.");

  if (dryRun) {
    for (const exam of exams) {
      console.log(`OK  ${exam.examLabel} (${exam.source}): ${exam.sections.map((s) => s.teil).join(", ")}`);
    }
    console.log("Dry run: nothing written.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
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
    console.log(`Done. ${created} created, ${updated} updated, ${unchanged} unchanged.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
