// Originality check for generated exam content: measures how much of a
// generated part repeats text from the private reference exams
// (ReferenceSection). A part is "too similar" when more than 10% of its
// 5-word sequences appear in any reference, or when any run of 8 identical
// words does. Pure string work — no model call. The generation route
// regenerates a flagged Teil once and keeps the less similar version.

import { prisma } from "@/lib/prisma";
import type { GeneratedPart } from "@/lib/examSchema";

export const OVERLAP_RATIO_LIMIT = 0.1;
export const OVERLAP_RUN_WORDS = 8;
const GRAM = 5;

// Keys whose text is standard exam phrasing (task instructions, the fixed
// speaking procedure steps): every honest exam repeats them, so they are
// left out of the reference side.
const STANDARD_PHRASING_KEYS = new Set(["instructions", "steps", "transcriptSource"]);

export type ReferenceIndex = { grams: Set<string>; runs: Set<string> };
export type Overlap = { ratio: number; longRun: boolean; tooSimilar: boolean };

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function gramsOf(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i++) out.push(tokens.slice(i, i + n).join(" "));
  return out;
}

function leafStrings(value: unknown, key = ""): string[] {
  if (STANDARD_PHRASING_KEYS.has(key)) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => leafStrings(v));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leafStrings(v, k));
  }
  return [];
}

export function buildReferenceIndex(pieces: string[]): ReferenceIndex {
  const grams = new Set<string>();
  const runs = new Set<string>();
  for (const piece of pieces) {
    const tokens = tokenize(piece);
    for (const g of gramsOf(tokens, GRAM)) grams.add(g);
    for (const r of gramsOf(tokens, OVERLAP_RUN_WORDS)) runs.add(r);
  }
  return { grams, runs };
}

// The generated text of one part that should be original: the passage or
// script, every question prompt and every option. The Arbeitsanweisung is
// standard phrasing and is not compared.
export function partTexts(part: GeneratedPart): string[] {
  return [
    part.passageText ?? "",
    ...part.questions.flatMap((q) => [q.prompt, ...(q.options ?? [])]),
  ].filter(Boolean);
}

export function measureOverlap(texts: string[], index: ReferenceIndex): Overlap {
  let total = 0;
  let shared = 0;
  let longRun = false;
  for (const text of texts) {
    const tokens = tokenize(text);
    for (const g of gramsOf(tokens, GRAM)) {
      total++;
      if (index.grams.has(g)) shared++;
    }
    if (!longRun) longRun = gramsOf(tokens, OVERLAP_RUN_WORDS).some((r) => index.runs.has(r));
  }
  const ratio = total === 0 ? 0 : shared / total;
  return { ratio, longRun, tooSimilar: longRun || ratio > OVERLAP_RATIO_LIMIT };
}

// Higher means more similar; used to keep the better of two attempts.
export function overlapScore(o: Overlap): number {
  return o.ratio + (o.longRun ? 1 : 0);
}

// The index is rebuilt at most every few minutes: the store only changes
// when the owner re-runs the import script.
const INDEX_TTL_MS = 5 * 60 * 1000;
let cached: { index: ReferenceIndex | null; at: number } | null = null;

// null when there is nothing to compare against (empty store) or the
// database is unavailable — the caller then skips the check.
export async function loadReferenceIndex(): Promise<ReferenceIndex | null> {
  if (cached && Date.now() - cached.at < INDEX_TTL_MS) return cached.index;
  try {
    const rows = await prisma.referenceSection.findMany({ select: { contentJson: true } });
    const index =
      rows.length === 0
        ? null
        : buildReferenceIndex(rows.flatMap((r) => leafStrings(JSON.parse(r.contentJson))));
    cached = { index, at: Date.now() };
    return index;
  } catch (err) {
    console.warn("[exam-generate] originality check unavailable, continuing without:", err);
    return null;
  }
}
