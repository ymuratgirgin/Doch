// Shared shapes for LLM-generated exam content and evaluation results,
// plus the deterministic telc B1 point table (§1/§4 of the spec) — point
// values are assigned by our own code, never trusted from model output.

export type GeneratedQuestion = {
  prompt: string;
  questionType: "multiple_choice" | "gap_fill" | "true_false" | "matching" | "free_text";
  options?: string[];
  correctAnswer?: string;
  grammarTopic?: string; // e.g. "Perfekt vs. Präteritum" — for grammar-bearing items
};

export type GeneratedPart = {
  type: "READING" | "LISTENING" | "WRITING" | "GRAMMAR" | "SPEAKING";
  teilLabel: string; // must be one of TEIL_POINTS' keys (or "Schriftlicher Ausdruck")
  instructions: string;
  passageText?: string; // reading passage / listening script (TTS-ready per spec §3.6)
  questions: GeneratedQuestion[];
};

// One call's response: just the parts for that section group (spec §3).
// The overall Exam.title is assigned by app code, not the model.
export type GeneratedSectionResponse = {
  parts: GeneratedPart[];
};

// --- telc B1 point table (spec §1/§4) — deterministic, not LLM-set -------

export const TEIL_POINTS: Record<string, number> = {
  "Leseverstehen Teil 1": 25,
  "Leseverstehen Teil 2": 25,
  "Leseverstehen Teil 3": 25,
  "Sprachbausteine Teil 1": 15,
  "Sprachbausteine Teil 2": 15,
  "Hörverstehen Teil 1": 25,
  "Hörverstehen Teil 2": 25,
  "Hörverstehen Teil 3": 25,
};
export const WRITING_TEIL_LABEL = "Schriftlicher Ausdruck";
export const WRITING_MAX_POINTS = 45;

// --- Generation modes -----------------------------------------------------

export type ExamMode = "full" | "reading" | "listening" | "writing" | "grammar";

// For "full" mode, generation is split into these call groups to keep each
// response within a comfortable token budget. Single-skill modes use one
// group each.
export const SECTION_GROUPS: Record<
  string,
  { label: string; teils: string[] }
> = {
  reading: { label: "Leseverstehen (Teil 1–3)", teils: ["Leseverstehen Teil 1", "Leseverstehen Teil 2", "Leseverstehen Teil 3"] },
  grammar: { label: "Sprachbausteine (Teil 1–2)", teils: ["Sprachbausteine Teil 1", "Sprachbausteine Teil 2"] },
  listening: { label: "Hörverstehen (Teil 1–3)", teils: ["Hörverstehen Teil 1", "Hörverstehen Teil 2", "Hörverstehen Teil 3"] },
  writing: { label: "Schriftlicher Ausdruck", teils: [WRITING_TEIL_LABEL] },
};

export function groupsForMode(mode: ExamMode): (keyof typeof SECTION_GROUPS)[] {
  if (mode === "full") return ["reading", "grammar", "listening", "writing"];
  return [mode];
}

// --- Writing evaluation (rubric + vocabulary extraction) ------------------

export type WritingCriterion = { grade: "A" | "B" | "C" | "D"; explanation: string };

export type WritingEvaluation = {
  criteria: {
    aufgabenbewaeltigung: WritingCriterion;
    kommunikativeGestaltung: WritingCriterion;
    formaleRichtigkeit: WritingCriterion;
  };
  vocabularyUsed: {
    word: string;
    wordType?: string;
    article?: string;
    correct: boolean;
    translation: string;
    exampleSentence: string;
    note?: string;
  }[];
  overallFeedback: string;
};

const GRADE_POINTS: Record<WritingCriterion["grade"], number> = { A: 5, B: 3, C: 1, D: 0 };

export function scoreWriting(evaluation: WritingEvaluation): number {
  const { aufgabenbewaeltigung, kommunikativeGestaltung, formaleRichtigkeit } = evaluation.criteria;
  const sum =
    GRADE_POINTS[aufgabenbewaeltigung.grade] +
    GRADE_POINTS[kommunikativeGestaltung.grade] +
    GRADE_POINTS[formaleRichtigkeit.grade];
  return sum * 3; // max 15 * 3 = 45, per spec §4
}

// --- Mistake explanations for wrong objective answers ----------------------

export type MistakeExplanation = {
  questionId: string;
  grammarTopic: string;
  grammarExplanation: string; // rule + 2-3 fresh examples
};

export const EXAM_JSON_INSTRUCTIONS = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this TypeScript shape:

{
  "parts": [
    {
      "type": "READING" | "LISTENING" | "WRITING" | "GRAMMAR",
      "teilLabel": string, // exact Teil name from the specification, e.g. "Leseverstehen Teil 1"
      "instructions": string, // the Arbeitsanweisung, in German
      "passageText"?: string, // reading passage(s) or listening script, per spec §3.6 for listening
      "questions": [
        {
          "prompt": string,
          "questionType": "multiple_choice" | "gap_fill" | "true_false" | "matching" | "free_text",
          "options"?: string[], // include ALL options, e.g. ["a) ...", "b) ...", "c) ..."] or the full word bank
          "correctAnswer"?: string, // required for every type except free_text
          "grammarTopic"?: string // short tag, only for Sprachbausteine/grammar-bearing items
        }
      ]
    }
  ]
}

For Leseverstehen Teil 1 and Teil 3 (matching tasks), encode the headlines/
ads as the "options" of a single synthetic question per situation/text, OR
— simpler and preferred — emit one question per text/situation with
"questionType": "matching", "options" containing the full lettered list
(headlines a-j, or ads a-l plus "x"), and "correctAnswer" the correct
letter (or "x").
`;

export const WRITING_EVALUATION_INSTRUCTIONS = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this TypeScript shape:

{
  "criteria": {
    "aufgabenbewaeltigung": { "grade": "A"|"B"|"C"|"D", "explanation": string },
    "kommunikativeGestaltung": { "grade": "A"|"B"|"C"|"D", "explanation": string },
    "formaleRichtigkeit": { "grade": "A"|"B"|"C"|"D", "explanation": string }
  },
  "vocabularyUsed": [
    {
      "word": string, // dictionary form (lemma)
      "wordType"?: string,
      "article"?: string, // der/die/das if a noun
      "correct": boolean, // was it used correctly (form, meaning, context)?
      "translation": string,
      "exampleSentence": string, // a clean example (their own if correct, a corrected one if not)
      "note"?: string // only if correct === false: what was wrong + the fix
    }
  ],
  "overallFeedback": string
}

List every content word (noun/verb/adjective/adverb) the learner used
beyond basic A1 function words, even if used correctly — this builds
their personal vocabulary record.
`;

export const MISTAKE_EXPLANATION_INSTRUCTIONS = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this TypeScript shape:

[
  { "questionId": string, "grammarTopic": string, "grammarExplanation": string }
]

For grammarExplanation: state the rule in 1-2 plain sentences, then give
2-3 short NEW German example sentences (not the exam sentence) that
illustrate it, each followed by a short translation in parentheses.
`;

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}
