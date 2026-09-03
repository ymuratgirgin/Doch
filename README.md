# Telc B1 Trainer

A web app for practicing the telc B1 German exam: generates fresh mock
exams from the official telc blueprint via Claude, grades them (including
a writing rubric and per-mistake grammar explanations), and tracks each
learner's vocabulary and progress over time.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + SQLite (via `@prisma/adapter-better-sqlite3`)
- `@anthropic-ai/sdk` for exam generation and answer evaluation
- Browser `SpeechSynthesis` (Web Speech API) for in-app listening playback

## Status / what's still open

- **Vocab enrichment.** The shared vocab bank (1,812 B1 words, seeded from
  `data/B1_cleaned.json`) has no translations or example sentences yet —
  run `npm run enrich-vocab` (needs `ANTHROPIC_API_KEY`) to fill them in
  via Claude, in resumable batches.
- **Auth is intentionally minimal.** Login is name-only, no password —
  fine for a small group of trusted testers, not for a public deployment.
- **Speaking (mündlicher Ausdruck)** is a solo-adapted, text/voice-transcript
  practice mode — the real exam is paired, so pronunciation isn't scored
  (browser speech-to-text only gives us a transcript, and Claude's API has
  no audio input), only vocabulary/task-fulfillment/grammar.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
npx prisma migrate dev
npx prisma db seed     # imports the B1 vocab list
npm run enrich-vocab   # optional: adds translations + examples (needs API key)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any name.

## How it works

- **Exam generation** (`src/app/api/exams/generate`) follows
  `data/telc-b1-mock-generator-spec.md` — the full telc B1 blueprint
  (item counts, distractor design, point values, timing) — verbatim. A
  "Complete Mock Exam" is assembled from parallel calls per section group
  (Lesen+Sprachbausteine, Hören, Schreiben); single-skill practice
  (Reading/Listening/Writing/Grammar) uses one call. Point values per
  question are assigned deterministically from the spec's point table,
  never trusted from model output. Generation is biased toward each
  learner's current weak areas (`src/lib/weakAreas.ts`).
- **Grading** (`src/app/api/attempts/[id]/submit`): objective questions
  (reading/listening/grammar) are auto-graded and scored by the spec's
  point table; every wrong answer gets a cached grammar/topic explanation
  with fresh examples. Writing is graded against telc's official 3-criteria
  rubric (Aufgabenbewältigung / Kommunikative Gestaltung / Formale
  Richtigkeit), and every content word the learner used is extracted,
  checked for correct usage, and recorded into their personal vocabulary
  bank (`PersonalVocabWord`) — this is what flashcards and mistake review
  draw on alongside the shared B1 word list.
- **Flashcards** (`src/lib/flashcards.ts`) prioritize words the learner
  used incorrectly, words due for spaced-repetition review (simple
  Leitner boxes), and words they've added manually — over plain "new"
  words from the shared bank. Adding a word (`/flashcards`) auto-fills
  translation/example via Claude if left blank.
- **Pass estimate** (`src/lib/passEstimate.ts`) is a rough heuristic
  against telc's official ≥60%-of-225-written-points pass threshold —
  not a statistical model, and it doesn't cover speaking.
- **Listening** reads the generated script aloud in-browser via
  `SpeechSynthesis` (`src/components/ListeningPlayer.tsx`), respecting the
  spec's once/twice playback rule per Teil.
- **Speaking** (`mode: "speaking"`) solo-adapts the paired oral exam's three
  Teile into monologue prompts, transcribed via the browser's
  `SpeechRecognition` API (`src/components/SpeakingRecorder.tsx`, with a
  type-instead fallback) and graded on 3 of the official 4 criteria
  (pronunciation excluded — can't be judged from text).
- **Timed practice.** Every exam gets a time budget (the real 90/30/30
  written timing for full mocks, a sensible slice for single-skill
  practice); the Attempt is created when the learner starts, not when they
  submit, so the countdown survives a page reload and auto-submits at zero.
- **Progress extras**: a Duolingo-style daily streak (`src/lib/streak.ts`),
  a per-skill score trend chart, and a daily practice recommendation
  (`src/lib/recommendation.ts`) that targets the weakest recent skill, or
  a full mock once the exam date is within two weeks.

## Project layout

- `prisma/schema.prisma` — data model.
- `data/` — the telc B1 spec and raw vocab source (pulled from `main`).
- `prompts/` — system prompts for generation and grading.
- `src/lib/` — generation/grading/flashcards/progress business logic.
- `src/app/` — dashboard, exams, vocab, flashcards, mistakes, progress,
  login pages and their API routes.
