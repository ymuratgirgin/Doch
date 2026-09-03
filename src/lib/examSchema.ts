// Shared shapes for LLM-generated exam content and evaluation results.
// Kept intentionally loose (strings, not enums) so the JSON the model
// returns can be validated defensively before hitting the database.

export type GeneratedQuestion = {
  prompt: string;
  questionType: "multiple_choice" | "gap_fill" | "free_text" | "matching";
  options?: string[];
  correctAnswer?: string;
};

export type GeneratedPart = {
  type: "READING" | "LISTENING" | "WRITING" | "GRAMMAR" | "SPEAKING";
  instructions?: string;
  passageText?: string;
  questions: GeneratedQuestion[];
};

export type GeneratedExam = {
  title: string;
  parts: GeneratedPart[];
};

export type EvaluationResult = {
  answers: {
    questionId: string;
    scoreAwarded: number; // 0-100
    feedback: string;
  }[];
  overallFeedback: string;
};

export const EXAM_JSON_INSTRUCTIONS = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this TypeScript shape:

{
  "title": string,
  "parts": [
    {
      "type": "READING" | "LISTENING" | "WRITING" | "GRAMMAR" | "SPEAKING",
      "instructions": string,
      "passageText"?: string,
      "questions": [
        {
          "prompt": string,
          "questionType": "multiple_choice" | "gap_fill" | "free_text" | "matching",
          "options"?: string[],
          "correctAnswer"?: string
        }
      ]
    }
  ]
}
`;

export const EVALUATION_JSON_INSTRUCTIONS = `
Respond with ONLY valid JSON (no markdown fences, no commentary) matching
this TypeScript shape:

{
  "answers": [
    { "questionId": string, "scoreAwarded": number, "feedback": string }
  ],
  "overallFeedback": string
}
`;

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}
