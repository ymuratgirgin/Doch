import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { EXAM_GENERATION_PROMPT, TELC_B1_SPEC } from "@/lib/prompts";
import { getUserWeakAreas } from "@/lib/weakAreas";
import {
  EXAM_JSON_INSTRUCTIONS,
  GeneratedPart,
  GeneratedSectionResponse,
  SECTION_GROUPS,
  TIME_BUDGET_MINUTES,
  ExamMode,
  extractJson,
  getTeilMaxPoints,
  groupsForMode,
} from "@/lib/examSchema";

// Generation runs several Claude calls (some in parallel); on Vercel's
// Hobby plan a serverless function is capped at 60s without Fluid Compute.
export const maxDuration = 60;

const MODE_TITLES: Record<ExamMode, string> = {
  full: "Telc B1 – Vollständige Mock-Prüfung",
  reading: "Telc B1 – Leseverstehen Übung",
  listening: "Telc B1 – Hörverstehen Übung",
  writing: "Telc B1 – Schriftlicher Ausdruck Übung",
  grammar: "Telc B1 – Sprachbausteine Übung",
  speaking: "Telc B1 – Mündlicher Ausdruck Übung (solo)",
};

const SPEAKING_ADAPTATION_NOTE = `
This is a SOLO practice adaptation of the paired oral exam in §3.8 — the
learner has no partner, so adapt each Teil to a monologue:
- Teil 1 (Einander kennenlernen): give 4-6 prompts/questions an examiner
  would ask (Name, Wohnort, Familie, Beruf/Studium, Sprachen, Hobbys) and
  ask the learner to introduce themselves answering all of them.
- Teil 2 (Über ein Thema sprechen): give ONE topic and ONE card — a
  fictional person's 40-60 word quoted opinion. Ask the learner to report
  the opinion, then give their own view and experience.
- Teil 3 (Gemeinsam etwas planen): give the planning scenario and
  checklist (Wann? Wo? Essen/Getränke? Wer macht was? Wer bezahlt?). Ask
  the learner to propose a complete plan addressing every checklist point,
  as if explaining it to a partner who isn't present.
Each Teil is ONE "free_text" question whose prompt contains the full
task (cards/checklist included). Set "type": "SPEAKING".
`;

async function generateSection(
  groupKey: keyof typeof SECTION_GROUPS,
  context: { weakAreasText: string; vocabText: string }
): Promise<GeneratedPart[]> {
  const group = SECTION_GROUPS[groupKey];
  const maxTokens = groupKey === "writing" || groupKey === "speaking" ? 3000 : 8000;

  const userMessage = [
    "--- SPECIFICATION ---",
    TELC_B1_SPEC,
    "--- TASK ---",
    `Generate ONLY this section of the exam: ${group.label}.`,
    `Produce exactly these Teil(e), each as one part in the "parts" array, in this order: ${group.teils.join(", ")}.`,
    groupKey === "speaking" ? SPEAKING_ADAPTATION_NOTE : "",
    context.weakAreasText,
    context.vocabText,
    EXAM_JSON_INSTRUCTIONS,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: EXAM_GENERATION_MODEL,
    max_tokens: maxTokens,
    system: EXAM_GENERATION_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`Model returned no text content for section "${groupKey}"`);
  }

  const parsed = extractJson(textBlock.text) as GeneratedSectionResponse;
  if (!Array.isArray(parsed.parts)) {
    throw new Error(`Malformed response for section "${groupKey}"`);
  }
  return parsed.parts;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const mode: ExamMode = [
    "full",
    "reading",
    "listening",
    "writing",
    "grammar",
    "speaking",
  ].includes(body.mode)
    ? body.mode
    : "full";

  const weakAreas = await getUserWeakAreas(user.id);
  const weakAreasText = weakAreas.length
    ? `The learner's current weak areas (per spec §7, bias difficulty/topic toward these where natural, without breaking the format rules): ${weakAreas.map((w) => w.grammarTopic).join(", ")}.`
    : "No weak-area data yet for this learner — use a balanced mix of topics/grammar.";

  const vocabSample = await prisma.vocabWord.findMany({
    where: { level: "B1" },
    take: 300,
  });
  const shuffled = vocabSample.sort(() => Math.random() - 0.5).slice(0, 60);
  const vocabText = shuffled.length
    ? `Sample of the learner's B1 vocabulary bank (prefer these where natural, but do not force them):\n${shuffled
        .map((w) => [w.article, w.word].filter(Boolean).join(" "))
        .join(", ")}`
    : "";

  let allParts: GeneratedPart[];
  try {
    const groups = groupsForMode(mode);
    const results = await Promise.all(
      groups.map((g) => generateSection(g, { weakAreasText, vocabText }))
    );
    allParts = results.flat();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 502 }
    );
  }

  const exam = await prisma.exam.create({
    data: {
      title: MODE_TITLES[mode],
      examMode: mode,
      timeBudgetMinutes: TIME_BUDGET_MINUTES[mode],
      generatedBy: "llm",
      promptSpec: EXAM_GENERATION_PROMPT,
      focusAreas: JSON.stringify(weakAreas.map((w) => w.grammarTopic)),
      parts: {
        create: allParts.map((part, partIndex) => {
          const teilTotal = getTeilMaxPoints(part.teilLabel);
          const perItem =
            teilTotal && part.questions.length > 0 ? teilTotal / part.questions.length : 1;

          return {
            type: part.type,
            teilLabel: part.teilLabel,
            order: partIndex,
            instructions: part.instructions,
            passageText: part.passageText,
            questions: {
              create: part.questions.map((q, qIndex) => ({
                order: qIndex,
                prompt: q.prompt,
                questionType: q.questionType,
                options: q.options ? JSON.stringify(q.options) : null,
                correctAnswer: q.correctAnswer ?? null,
                grammarTopic: q.grammarTopic ?? null,
                maxPoints: perItem,
              })),
            },
          };
        }),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ examId: exam.id });
}
