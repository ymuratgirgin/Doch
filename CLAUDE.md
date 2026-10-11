@AGENTS.md

# Doch — project guide for Claude Code

telc B1 German exam prep app. Generates mock exams from the telc blueprint via Claude, grades them, tracks progress and vocabulary.

## Stack
- Next.js App Router + TypeScript + Tailwind (this Next.js version differs from training data — see AGENTS.md)
- Prisma 7 + Postgres (`@prisma/adapter-pg`), deployed on Vercel; build runs `prisma migrate deploy`
- `@anthropic-ai/sdk` for generation and grading; Google Cloud TTS (optional) for listening audio
- UI available in three languages; language is stored in a cookie (`doch_lang`), not per user in the DB

## Where things live
- `prisma/schema.prisma` — data model
- `data/telc-b1-mock-generator-spec.md` — telc B1 blueprint the generator follows verbatim
- `data/B1_cleaned.json` — B1 vocabulary seed
- `data/exam-difficulty-notes.md` — our own difficulty calibration per task type (reviewed by the owner; not yet used by the generator)
- `prompts/` — system prompts for generation and grading
- `src/lib/` — business logic (weakAreas, passEstimate, flashcards, streak, recommendation, tts, referenceExemplars, originality)
- `scripts/` — one-off scripts; `scripts/import-reference.ts` loads the private reference exams and extra vocabulary from `reference/` into Postgres
- `src/app/` — pages and API routes (home page doubles as landing/dashboard/login, plus exams, vocab, flashcards, mistakes, progress)
- `CHANGELOG.md` — release notes, one entry per sync to `main`, newest first
- `docs/specs/` — one spec per change, `YYYY-MM-DD-<name>.md`; `TEMPLATE.md` is the starting point, `README.md` explains the convention

## Rules
- Never change `schema.prisma` without saying what the migration does. Every schema change ships with a migration that applies cleanly on both a fresh DB and the existing production DB.
- Point values per question come from the spec's point table, never from model output.
- All user-facing text goes through the existing translation mechanism and must exist in all three languages.
- Exam content is German; explanations, feedback and study material are in the learner's selected language.
- Never commit copyrighted exam material (official Modelltests, prep-book content) or third-party vocabulary lists. Local copies live in `reference/` (`reference/exams/*.json`, `reference/vocab/*.json`), which is git-ignored and never deployed; Vercel builds from GitHub, so the live app reads them only from the database (`ReferenceSection` for exams, `VocabWord` rows with source `einfach-gut-b1` for the extra vocabulary). Details and decisions: `docs/specs/2026-09-28-reference-exams.md`.
- Reference exams may only shape generation as labelled style/difficulty exemplars in the task block. Generated content must be new, and the originality check in `src/lib/originality.ts` must stay on; it never blocks the learner.
- Don't refactor unrelated code. One feature per commit.

## Commands
- `npm run dev` — local dev (needs `DATABASE_URL`, `ANTHROPIC_API_KEY` in `.env`)
- `npm run lint` and `npx tsc --noEmit` — run both before every commit
- `npx prisma migrate dev` — create a migration locally
- `npx prisma db seed` — load the vocab list
- `npm run import:reference` — load the private reference exams and vocabulary from `reference/` into the database (idempotent; `-- --dry-run` validates the files without a database)

## Workflow
1. Read the spec in `docs/specs/` I point you to.
2. Explore the relevant code and summarize what you found and what you assume.
3. Ask before building if anything is ambiguous, especially data-model changes.
4. Propose a plan, implement one feature at a time, lint + typecheck, commit, stop for review.
5. When the spec is finished: set its status to `done` and add an "Outcome" section with a short changelog and recommended follow-ups. Finished specs stay in `docs/specs/` as detailed notes and context; the release log is `CHANGELOG.md`.
6. Before syncing to `main`, add an entry at the top of `CHANGELOG.md` (date, title, what changed in plain language, anything I have to do after the deploy) and include it in the sync. Detailed notes stay in the spec's Outcome section.
7. If I correct you on something that will recur, tell me so I can add it to this file.
