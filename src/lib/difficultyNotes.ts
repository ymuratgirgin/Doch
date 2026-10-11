// Our own per-task difficulty calibration (data/exam-difficulty-notes.md),
// added to the generation task block for the Teile being generated. The
// blueprint stays the authority for structure and points; the notes only
// calibrate difficulty inside it. Unlike the reference exemplars this is a
// committed file, so it works without the database. A missing file or an
// unmatched Teil simply yields no block.

import { readFileSync } from "fs";
import path from "path";

// Generated part label -> heading prefix of its section in the notes file
const NOTES_HEADING: Record<string, string> = {
  "Leseverstehen Teil 1": "Leseverstehen Teil 1",
  "Leseverstehen Teil 2": "Leseverstehen Teil 2",
  "Leseverstehen Teil 3": "Leseverstehen Teil 3",
  "Sprachbausteine Teil 1": "Sprachbausteine Teil 1",
  "Sprachbausteine Teil 2": "Sprachbausteine Teil 2",
  "Hörverstehen Teil 1": "Hörverstehen Teil 1",
  "Hörverstehen Teil 2": "Hörverstehen Teil 2",
  "Hörverstehen Teil 3": "Hörverstehen Teil 3",
  "Schriftlicher Ausdruck": "Schriftlicher Ausdruck",
  "Mündlicher Ausdruck Teil 1": "Mündlicher Ausdruck",
  "Mündlicher Ausdruck Teil 2": "Mündlicher Ausdruck",
  "Mündlicher Ausdruck Teil 3": "Mündlicher Ausdruck",
};

const INTRO = `--- DIFFICULTY CALIBRATION ---
These notes describe how hard real telc B1 tasks of the same type are (measured on real exams). Aim for this difficulty: stay inside the length ranges, build distractors as described, and keep the answer key balanced. The specification above stays authoritative for structure, item counts and formats; where a note and the specification differ on length, follow the specification. Never mention these notes in your output.`;

let sections: Map<string, string> | null = null;

function loadSections(): Map<string, string> {
  if (sections) return sections;
  sections = new Map();
  try {
    const text = readFileSync(path.join(process.cwd(), "data", "exam-difficulty-notes.md"), "utf-8");
    for (const part of text.split(/^## /m).slice(1)) {
      const heading = part.split("\n", 1)[0].trim();
      sections.set(heading, `## ${part.trim()}`);
    }
  } catch (err) {
    console.warn("[exam-generate] difficulty notes unavailable, continuing without:", err);
  }
  return sections;
}

export function loadDifficultyBlock(teilLabels: string[]): string {
  const all = loadSections();
  const wanted = new Set(teilLabels.map((l) => NOTES_HEADING[l]).filter(Boolean));
  const picked: string[] = [];
  for (const prefix of wanted) {
    for (const [heading, body] of all) {
      if (heading.startsWith(prefix)) picked.push(body);
    }
  }
  return picked.length ? [INTRO, ...picked].join("\n\n") : "";
}
