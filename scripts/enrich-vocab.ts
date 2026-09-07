// Fills in missing flashcard fields (example sentences, Turkish
// translations) for every VocabWord row, by batching words through Claude.
// Idempotent/resumable: each pass only pulls rows still missing that field,
// so a crash or Ctrl-C just leaves the rest for the next run.
//
// Usage: npx tsx scripts/enrich-vocab.ts
// Requires ANTHROPIC_API_KEY in the environment (.env is loaded).

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BATCH_SIZE = 50;
const GENERATION_MODEL = "claude-sonnet-5";
// A single word's translation doesn't need Sonnet-level judgment — Haiku
// 4.5 runs no thinking by default and doesn't support output_config.effort.
const LOOKUP_MODEL = "claude-haiku-4-5";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Word = { id: string; word: string; wordType: string | null; article: string | null };

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function runEnrichmentPass<T extends { id: string }>(opts: {
  label: string;
  where: Record<string, unknown>;
  model: string;
  useEffort: boolean;
  system: string;
  buildPrompt: (listing: string) => string;
  applyUpdate: (word: Word, entry: T) => Promise<void>;
}) {
  let totalDone = 0;
  for (;;) {
    const batch = await prisma.vocabWord.findMany({
      where: opts.where,
      take: BATCH_SIZE,
      select: { id: true, word: true, wordType: true, article: true },
    });
    if (batch.length === 0) break;

    console.log(`[${opts.label}] Enriching batch of ${batch.length} (done so far: ${totalDone})...`);
    const listing = batch
      .map((w) => `${w.id} :: ${[w.article, w.word].filter(Boolean).join(" ")} (${w.wordType ?? "unknown"})`)
      .join("\n");

    let enriched: T[];
    try {
      const response = await anthropic.messages.create({
        model: opts.model,
        max_tokens: 8000,
        ...(opts.useEffort ? { output_config: { effort: "low" as const } } : {}),
        system: opts.system,
        messages: [{ role: "user", content: opts.buildPrompt(listing) }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("Model returned no text content");
      }
      enriched = extractJson(textBlock.text) as T[];
    } catch (err) {
      console.error(`[${opts.label}] Batch failed, will retry remaining rows next run:`, err);
      break;
    }

    const byId = new Map(enriched.map((e) => [e.id, e]));
    for (const w of batch) {
      const e = byId.get(w.id);
      if (!e) continue;
      await opts.applyUpdate(w, e);
    }
    totalDone += batch.length;
  }

  console.log(`[${opts.label}] Done. Enriched ${totalDone} words this run.`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  await runEnrichmentPass<{ id: string; exampleSentence: string }>({
    label: "exampleSentence",
    where: { exampleSentence: null },
    model: GENERATION_MODEL,
    useEffort: true,
    system:
      "You are a German lexicographer building flashcard content for CEFR B1 learners. Everything you write is in German — no English.",
    buildPrompt: (listing) => `For each German B1 word below (format: id :: word (part of speech)), give:
- exampleSentence: ONE natural German sentence using the word at B1 level, showing its meaning in context

Words:
${listing}

Respond with ONLY a JSON array (no markdown fences, no commentary):
[{"id": string, "exampleSentence": string}, ...]
One entry per word, in any order, using the exact id given.`,
    applyUpdate: async (w, e) => {
      await prisma.vocabWord.update({ where: { id: w.id }, data: { exampleSentence: e.exampleSentence } });
    },
  });

  await runEnrichmentPass<{ id: string; translationTr: string }>({
    label: "translationTr",
    where: { translationTr: null },
    model: LOOKUP_MODEL,
    useEffort: false,
    system: "You are a German-Turkish lexicographer helping a B1 learner build flashcards.",
    buildPrompt: (listing) => `For each German B1 word below (format: id :: word (part of speech)), give its Turkish translation (dictionary form, matching the word's part of speech).

Words:
${listing}

Respond with ONLY a JSON array (no markdown fences, no commentary):
[{"id": string, "translationTr": string}, ...]
One entry per word, in any order, using the exact id given.`,
    applyUpdate: async (w, e) => {
      await prisma.vocabWord.update({ where: { id: w.id }, data: { translationTr: e.translationTr } });
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
