// Turns private reference exam sections (ReferenceSection, see
// scripts/import-reference.ts) into a labelled exemplar block for the
// generation prompt. The exemplars calibrate length, register, distractor
// plausibility and difficulty only — the prompt tells the model to invent
// everything. With an empty table (or any database error) this returns an
// empty string and generation behaves exactly as it did without exemplars.

import { prisma } from "@/lib/prisma";
import { WRITING_TEIL_LABEL } from "@/lib/examSchema";
import { pickRandom } from "@/lib/random";

// Exemplars per Teil in one generation call. One keeps the prompt small
// (a Teil is roughly 250-1,700 tokens); raise it to show several exams.
const EXEMPLARS_PER_TEIL = 1;

// A rendered exemplar longer than this is skipped rather than cut mid-text.
const MAX_EXEMPLAR_CHARS = 7000;

// Generated part label -> ReferenceSection.teil
export const REFERENCE_TEIL_KEY: Record<string, string> = {
  "Leseverstehen Teil 1": "lesen-1",
  "Leseverstehen Teil 2": "lesen-2",
  "Leseverstehen Teil 3": "lesen-3",
  "Sprachbausteine Teil 1": "sprachbausteine-1",
  "Sprachbausteine Teil 2": "sprachbausteine-2",
  "Hörverstehen Teil 1": "hoeren-1",
  "Hörverstehen Teil 2": "hoeren-2",
  "Hörverstehen Teil 3": "hoeren-3",
  [WRITING_TEIL_LABEL]: "schreiben",
  "Mündlicher Ausdruck Teil 1": "sprechen-1",
  "Mündlicher Ausdruck Teil 2": "sprechen-2",
  "Mündlicher Ausdruck Teil 3": "sprechen-3",
};

type Obj = Record<string, unknown>;

function entries(value: unknown): [string, string][] {
  return Object.entries((value ?? {}) as Obj).map(([k, v]) => [k, String(v)]);
}

function lines(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function keyLine(answerKey: string | null): string {
  if (!answerKey) return "";
  const pairs = Object.entries(JSON.parse(answerKey) as Record<string, string>).map(([n, a]) => `${n} ${a}`);
  return pairs.length ? `Lösung: ${pairs.join(", ")}` : "";
}

// One reference section as plain German text, with its answer key.
export function renderReferenceSection(
  teil: string,
  contentJson: string,
  answerKeyJson: string | null,
  spokenNotes: string | null
): string {
  const c = JSON.parse(contentJson) as Obj;
  const out: string[] = [];
  switch (teil) {
    case "lesen-1":
      out.push("Überschriften:", ...entries(c.headings).map(([l, t]) => `${l}) ${t}`));
      out.push("Texte:", ...entries(c.texts).map(([n, t]) => `${n}. ${t}`));
      break;
    case "lesen-2": {
      out.push(String(c.title), String(c.text), "Aufgaben:");
      for (const q of (c.questions as Obj[]) ?? []) {
        out.push(`${q.n}. ${q.stem}`, ...entries(q.options).map(([l, t]) => `   ${l}) ${t}`));
      }
      break;
    }
    case "lesen-3":
      out.push("Situationen:", ...entries(c.situations).map(([n, t]) => `${n}. ${t}`));
      out.push("Anzeigen:", ...entries(c.ads).map(([l, t]) => `${l}) ${t}`));
      break;
    case "sprachbausteine-1": {
      out.push(String(c.text), "Auswahl:");
      for (const [n, opts] of Object.entries((c.options ?? {}) as Record<string, Obj>)) {
        out.push(`${n}: ${entries(opts).map(([l, t]) => `${l}) ${t}`).join("  ")}`);
      }
      break;
    }
    case "sprachbausteine-2":
      out.push(String(c.text), `Wörter: ${entries(c.words).map(([l, w]) => `${l}) ${w}`).join("  ")}`);
      break;
    case "hoeren-1":
    case "hoeren-2":
    case "hoeren-3":
      out.push("Aussagen:", ...entries(c.statements).map(([n, t]) => `${n}. ${t}`));
      if (typeof c.transcript === "string") out.push("Hörtext:", c.transcript);
      if (spokenNotes) out.push(`Aufbau der Aufnahme: ${spokenNotes}`);
      break;
    case "schreiben":
      out.push(String(c.email), "Leitpunkte:", ...lines(c.points).map((p) => `- ${p}`));
      break;
    case "sprechen-1":
      out.push(String(c.instructions), ...lines(c.topics).map((t) => `- ${t}`));
      break;
    case "sprechen-2": {
      out.push(String(c.instructions), `Thema: ${c.topic}`);
      for (const [who, card] of Object.entries((c.cards ?? {}) as Record<string, Obj>)) {
        out.push(`Karte ${who}: „${card.text}“ — ${card.author}`);
      }
      break;
    }
    case "sprechen-3":
      out.push(String(c.scenario), ...lines(c.checklist).map((t) => `- ${t}`), ...lines(c.steps));
      break;
    default:
      throw new Error(`No renderer for reference teil "${teil}"`);
  }
  const key = keyLine(answerKeyJson);
  if (key) out.push(key);
  return out.join("\n");
}

const EXEMPLAR_INTRO = `--- REFERENCE EXEMPLARS (style and difficulty only) ---
Below are real exam sections of the same Teil type(s) you must produce. Use them ONLY to calibrate text length, register, distractor plausibility, how close the wrong options sit to the right one, and the phrasing of instructions. Everything you write must be new: different topics, invented people, organisations, places and numbers, and no sentence, headline, ad, statement or option copied or closely paraphrased from an exemplar. Their listening transcripts carry no "Herr/Frau <Name>:" speaker labels — your scripts must still follow the labeling and TTS rules of the specification. Speaking exemplars show the paired format; still follow the solo adaptation given above. In exemplar answer keys "+" means richtig, "-" means falsch and "x" means no matching ad. Never mention the exemplars in your output.`;

// Exemplar block for the given Teil labels, or "" when there is nothing to show.
export async function loadExemplarBlock(teilLabels: string[]): Promise<string> {
  try {
    const wanted = teilLabels.filter((label) => REFERENCE_TEIL_KEY[label]);
    if (wanted.length === 0) return "";
    const rows = await prisma.referenceSection.findMany({
      where: { teil: { in: wanted.map((label) => REFERENCE_TEIL_KEY[label]) } },
    });
    const blocks: string[] = [];
    const used: string[] = [];
    for (const label of wanted) {
      const teil = REFERENCE_TEIL_KEY[label];
      const candidates = rows
        .filter((r) => r.teil === teil)
        .map((r) => ({ row: r, text: renderReferenceSection(r.teil, r.contentJson, r.answerKeyJson, r.spokenNotes) }))
        .filter((c) => c.text.length <= MAX_EXEMPLAR_CHARS);
      for (const { row, text } of pickRandom(candidates, EXEMPLARS_PER_TEIL)) {
        blocks.push(`[Exemplar — ${label}]\n${text}`);
        used.push(`${teil}:${row.examLabel}`);
      }
    }
    if (blocks.length === 0) return "";
    console.log(`[exam-generate] exemplars=${used.join(",")}`);
    return [EXEMPLAR_INTRO, ...blocks].join("\n\n");
  } catch (err) {
    console.warn("[exam-generate] reference exemplars unavailable, continuing without:", err);
    return "";
  }
}
