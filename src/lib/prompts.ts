import { readFileSync } from "fs";
import path from "path";

function loadPrompt(filename: string): string {
  return readFileSync(path.join(process.cwd(), "prompts", filename), "utf-8");
}

export const EXAM_GENERATION_PROMPT = loadPrompt("exam-generation.md");
export const ANSWER_EVALUATION_PROMPT = loadPrompt("answer-evaluation.md");
