import { prisma } from "@/lib/prisma";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { extractJson, type WritingEvaluation } from "@/lib/examSchema";

type WordDetails = {
  word: string;
  wordType?: string | null;
  article?: string | null;
  exampleSentence?: string | null;
  meaning?: string | null;
  plural?: string | null;
  pastParticiple?: string | null;
  auxiliaryVerb?: string | null;
  praeteritum?: string | null;
  usageCorrect?: boolean;
  usageNote?: string | null;
  addedManually?: boolean;
};

async function upsertPersonalWord(userId: string, entry: WordDetails) {
  const wordType = entry.wordType ?? null;
  const existing = await prisma.personalVocabWord.findFirst({
    where: { userId, word: entry.word, wordType },
  });

  const personalWord = existing
    ? await prisma.personalVocabWord.update({
        where: { id: existing.id },
        data: {
          article: entry.article ?? existing.article,
          exampleSentence: entry.exampleSentence || existing.exampleSentence,
          meaning: entry.meaning || existing.meaning,
          plural: entry.plural || existing.plural,
          pastParticiple: entry.pastParticiple || existing.pastParticiple,
          auxiliaryVerb: entry.auxiliaryVerb || existing.auxiliaryVerb,
          praeteritum: entry.praeteritum || existing.praeteritum,
          usageCorrect: entry.usageCorrect ?? existing.usageCorrect,
          usageNote: entry.usageCorrect === false ? (entry.usageNote ?? existing.usageNote) : existing.usageNote,
          timesUsed: existing.timesUsed + 1,
          lastSeenAt: new Date(),
        },
      })
    : await prisma.personalVocabWord.create({
        data: {
          userId,
          word: entry.word,
          wordType,
          article: entry.article,
          exampleSentence: entry.exampleSentence,
          meaning: entry.meaning,
          plural: entry.plural,
          pastParticiple: entry.pastParticiple,
          auxiliaryVerb: entry.auxiliaryVerb,
          praeteritum: entry.praeteritum,
          usageCorrect: entry.usageCorrect ?? true,
          usageNote: entry.usageCorrect === false ? entry.usageNote : null,
          addedManually: entry.addedManually ?? false,
        },
      });

  const existingProgress = await prisma.userVocabProgress.findFirst({
    where: { userId, personalVocabWordId: personalWord.id },
  });
  if (!existingProgress) {
    await prisma.userVocabProgress.create({
      data: { userId, personalVocabWordId: personalWord.id },
    });
  }

  return personalWord;
}

// Records the vocabulary a learner used in a writing answer into their
// personal vocab bank (PersonalVocabWord), and makes sure it has a
// spaced-repetition progress row so it shows up in flashcards too.
// Called every time a writing task is graded — this is the "vocabulary
// database per user, updated every session" the app builds up over time.
export async function recordVocabUsage(
  userId: string,
  vocabularyUsed: WritingEvaluation["vocabularyUsed"]
) {
  for (const entry of vocabularyUsed) {
    await upsertPersonalWord(userId, {
      word: entry.word,
      wordType: entry.wordType,
      article: entry.article,
      exampleSentence: entry.exampleSentence,
      meaning: entry.meaning,
      plural: entry.plural,
      pastParticiple: entry.pastParticiple,
      auxiliaryVerb: entry.auxiliaryVerb,
      praeteritum: entry.praeteritum,
      usageCorrect: entry.correct,
      usageNote: entry.note,
    });
  }
}

// Adds a word the learner typed in themselves (flashcards "add word" form).
// Fills in the flashcard details via Claude if the learner didn't supply
// them: a German meaning, an example sentence, and (depending on part of
// speech) the plural or the verb's Perfekt/Präteritum forms.
export async function addManualWord(
  userId: string,
  input: { word: string; wordType?: string; article?: string; exampleSentence?: string }
) {
  let exampleSentence = input.exampleSentence?.trim() || null;
  let meaning: string | null = null;
  let plural: string | null = null;
  let pastParticiple: string | null = null;
  let auxiliaryVerb: string | null = null;
  let praeteritum: string | null = null;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await anthropic.messages.create({
        model: EXAM_GENERATION_MODEL,
        max_tokens: 500,
        system:
          "You are a German lexicographer helping a B1 learner build flashcards. Everything you write is in German — no English.",
        messages: [
          {
            role: "user",
            content: `Word: ${[input.article, input.word].filter(Boolean).join(" ")} (${input.wordType ?? "unknown part of speech"})

Respond with ONLY JSON:
{"exampleSentence": string, "meaning": string, "wordType": string, "article": string|null, "plural": string|null, "pastParticiple": string|null, "auxiliaryVerb": string|null, "praeteritum": string|null}

- exampleSentence: one natural German sentence at B1 level using the word (skip only if one was already supplied)
- meaning: a short German definition/paraphrase of the word (not a translation into another language)
- wordType: your best guess at part of speech (noun/verb/adjective/adverb/etc.) if not given
- article: der/die/das if it's a noun, else null
- plural: if it's a noun, its plural form without the article; else null
- pastParticiple: if it's a verb, the Partizip II; else null
- auxiliaryVerb: if it's a verb, "haben" or "sein" (Perfekt auxiliary); else null
- praeteritum: if it's a verb, the 3rd person singular Präteritum form; else null`,
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock?.type === "text") {
        const parsed = extractJson(textBlock.text) as {
          exampleSentence?: string;
          meaning?: string;
          wordType?: string;
          article?: string | null;
          plural?: string | null;
          pastParticiple?: string | null;
          auxiliaryVerb?: string | null;
          praeteritum?: string | null;
        };
        exampleSentence = exampleSentence || parsed.exampleSentence || null;
        meaning = parsed.meaning || null;
        plural = parsed.plural || null;
        pastParticiple = parsed.pastParticiple || null;
        auxiliaryVerb = parsed.auxiliaryVerb || null;
        praeteritum = parsed.praeteritum || null;
        input.wordType = input.wordType || parsed.wordType;
        input.article = input.article || parsed.article || undefined;
      }
    } catch {
      // Best-effort enrichment — the word is still saved even if this fails.
    }
  }

  return upsertPersonalWord(userId, {
    word: input.word,
    wordType: input.wordType,
    article: input.article,
    exampleSentence,
    meaning,
    plural,
    pastParticiple,
    auxiliaryVerb,
    praeteritum,
    addedManually: true,
  });
}
