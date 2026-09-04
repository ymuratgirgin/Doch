import { prisma } from "@/lib/prisma";
import { anthropic, EXAM_GENERATION_MODEL } from "@/lib/anthropic";
import { extractJson, type WritingEvaluation } from "@/lib/examSchema";

async function upsertPersonalWord(
  userId: string,
  entry: {
    word: string;
    wordType?: string | null;
    article?: string | null;
    exampleSentence?: string | null;
    usageCorrect?: boolean;
    usageNote?: string | null;
    addedManually?: boolean;
  }
) {
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
      usageCorrect: entry.correct,
      usageNote: entry.note,
    });
  }
}

// Adds a word the learner typed in themselves (flashcards "add word" form).
// Fills in a German example sentence via Claude if the learner didn't
// supply one.
export async function addManualWord(
  userId: string,
  input: { word: string; wordType?: string; article?: string; exampleSentence?: string }
) {
  let exampleSentence = input.exampleSentence?.trim() || null;

  if (!exampleSentence && process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await anthropic.messages.create({
        model: EXAM_GENERATION_MODEL,
        max_tokens: 300,
        system:
          "You are a German lexicographer helping a B1 learner build flashcards. Everything you write is in German — no English.",
        messages: [
          {
            role: "user",
            content: `Word: ${[input.article, input.word].filter(Boolean).join(" ")} (${input.wordType ?? "unknown part of speech"})

Respond with ONLY JSON: {"exampleSentence": string, "wordType": string, "article": string|null}
- exampleSentence: one natural German sentence at B1 level using the word
- wordType: your best guess at part of speech (noun/verb/adjective/adverb/etc.) if not given
- article: der/die/das if it's a noun, else null`,
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      if (textBlock?.type === "text") {
        const parsed = extractJson(textBlock.text) as {
          exampleSentence?: string;
          wordType?: string;
          article?: string | null;
        };
        exampleSentence = exampleSentence || parsed.exampleSentence || null;
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
    addedManually: true,
  });
}
