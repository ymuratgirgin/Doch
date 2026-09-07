import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;

export const EXAM_GENERATION_MODEL = "claude-sonnet-5";

// For small, low-stakes lookups (a single word's definition/example) where
// Sonnet-level judgment isn't needed — roughly a tenth of the cost.
export const LOOKUP_MODEL = "claude-haiku-4-5";
