// Fills in exampleSentence for every VocabWord row that's missing one, by
// batching words through Claude. Idempotent/resumable: each batch only
// pulls rows still missing an example, so a crash or Ctrl-C just leaves the
// rest for the next run.
//
// Usage: npx tsx scripts/enrich-vocab.ts
// Requires ANTHROPIC_API_KEY in the environment (.env is loaded).

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BATCH_SIZE = 50;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type EnrichedEntry = {
  id: string;
  exampleSentence: string;
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

async function enrichBatch(
  words: { id: string; word: string; wordType: string | null; article: string | null }[]
) {
  const listing = words
    .map(
      (w) =>
        `${w.id} :: ${[w.article, w.word].filter(Boolean).join(" ")} (${w.wordType ?? "unknown"})`
    )
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system:
      "You are a German lexicographer building flashcard content for CEFR B1 learners. Everything you write is in German — no English.",
    messages: [
      {
        role: "user",
        content: `For each German B1 word below (format: id :: word (part of speech)), give:
- exampleSentence: ONE natural German sentence using the word at B1 level, showing its meaning in context

Words:
${listing}

Respond with ONLY a JSON array (no markdown fences, no commentary):
[{"id": string, "exampleSentence": string}, ...]
One entry per word, in any order, using the exact id given.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text content");
  }
  return extractJson(textBlock.text) as EnrichedEntry[];
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  let totalDone = 0;
  for (;;) {
    const batch = await prisma.vocabWord.findMany({
      where: { exampleSentence: null },
      take: BATCH_SIZE,
      select: { id: true, word: true, wordType: true, article: true },
    });
    if (batch.length === 0) break;

    console.log(`Enriching batch of ${batch.length} (done so far: ${totalDone})...`);
    let enriched: EnrichedEntry[];
    try {
      enriched = await enrichBatch(batch);
    } catch (err) {
      console.error("Batch failed, will retry remaining rows next run:", err);
      break;
    }

    const byId = new Map(enriched.map((e) => [e.id, e]));
    for (const w of batch) {
      const e = byId.get(w.id);
      if (!e) continue;
      await prisma.vocabWord.update({
        where: { id: w.id },
        data: { exampleSentence: e.exampleSentence },
      });
    }
    totalDone += batch.length;
  }

  console.log(`Done. Enriched ${totalDone} words this run.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
