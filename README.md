# Doch!

A web app for practicing the telc B1 German exam: generates fresh mock
exams from the official telc blueprint via Claude, grades them (including
a writing rubric and per-mistake grammar explanations), and tracks each
learner's vocabulary and progress over time.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + Postgres (via `@prisma/adapter-pg`)
- `@anthropic-ai/sdk` for exam generation and answer evaluation
- Google Cloud Text-to-Speech for listening playback audio (falls back to
  the browser's built-in `SpeechSynthesis` if unconfigured/unreachable)
- Browser `SpeechRecognition` (Web Speech API) for speaking practice

## Status / what's still open

- **Auth is intentionally minimal.** Login is name-only, no password —
  fine for a small group of trusted testers, not for a public deployment.
- **Speaking (mündlicher Ausdruck)** is a solo-adapted, text/voice-transcript
  practice mode — the real exam is paired, so pronunciation isn't scored
  (browser speech-to-text only gives us a transcript, and Claude's API has
  no audio input), only vocabulary/task-fulfillment/grammar.

## Getting started (local)

Needs a Postgres database — either a local install or any hosted free
tier (Neon, Supabase, Vercel Postgres all work; grab the connection
string they give you).

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL (postgresql://...) and ANTHROPIC_API_KEY
npx prisma migrate dev
npx prisma db seed     # imports the B1 vocab list (Turkish translation + 2 example
                        # sentences per word are curated in data/B1_cleaned.json —
                        # no API key needed; re-run any time to sync content updates)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with any name.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the
   repo) and import it in [Vercel](https://vercel.com/new).
2. In the new project, go to **Storage → Create Database → Postgres**
   (or connect an existing Neon/Supabase instance) — this automatically
   sets `DATABASE_URL` as a project environment variable, no copy-pasting
   needed.
3. Add `DIRECT_URL` under **Settings → Environment Variables**, set to
   Neon's **unpooled** connection string (same credentials as
   `DATABASE_URL`, just without `-pooler` in the hostname). `prisma
   migrate deploy` needs a direct, non-pooled connection to take its
   advisory lock — pointing it at the pooled `DATABASE_URL` instead
   causes deploys to fail with `P1002: timed out trying to acquire a
   postgres advisory lock`. Scope it to every environment (Production
   *and* Preview) you deploy to.
4. Add `ANTHROPIC_API_KEY` under **Settings → Environment Variables**
   (skip this if you're not ready — the app runs fine without it, exam
   generation/grading/enrichment will just show a clear error). Scope it
   to every environment you deploy to as well — a key added for
   Production only won't be available on Preview deployments.
5. Optionally add `GOOGLE_TTS_API_KEY` the same way, to replace the
   robotic browser voice with real Google Cloud TTS audio for listening
   playback (see "Getting real listening audio" below) — skip it and the
   app just falls back to the browser's built-in voice.
6. Deploy. The build script (`prisma generate && prisma migrate deploy &&
   next build`) applies any pending migrations automatically on every
   deploy — safe to run repeatedly, it only ever applies new migrations.
7. **One-time seed step**: migrations don't seed data. After the first
   successful deploy, run `npx prisma db seed` locally with `DATABASE_URL`
   pointed at the production database (pull it via `vercel env pull`, or
   copy it from the Storage tab) to load the B1 vocab list.

## Getting real listening audio

Without `GOOGLE_TTS_API_KEY`, Hörverstehen playback uses the browser's
built-in `SpeechSynthesis` voice, which can sound noticeably robotic.
Setting it swaps in real Google Cloud Text-to-Speech audio instead
(`src/lib/tts.ts`, called from `/api/tts`):

1. In the [Google Cloud Console](https://console.cloud.google.com/), create
   a project (or use an existing one) and enable the **Cloud Text-to-Speech
   API**.
2. Under **APIs & Services → Credentials**, create an API key. Cloud TTS
   bills per character synthesized — a full mock exam's listening scripts
   run roughly 900-1,450 words (~6,000-9,000 characters), which costs well
   under $0.15 per exam on the Neural2 voice this app uses (`de-DE-Neural2-B`
   in `src/lib/tts.ts` — swap it for another
   [supported German voice](https://cloud.google.com/text-to-speech/docs/voices)
   if you'd like a different one).
3. Add `GOOGLE_TTS_API_KEY` to `.env` (local) and to Vercel's Environment
   Variables (production/preview).

If the key is missing, misconfigured, or the request fails for any reason,
`ListeningPlayer` silently falls back to the browser voice — there's no
broken state either way, just a quality difference.

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
