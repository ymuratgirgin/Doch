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
- `prompts/` — system prompts for generation and grading
- `src/lib/` — business logic (weakAreas, passEstimate, flashcards, streak, recommendation, tts)
- `src/app/` — pages and API routes (home page doubles as landing/dashboard/login, plus exams, vocab, flashcards, mistakes, progress)
- `docs/specs/` — one spec per change, `YYYY-MM-DD-<name>.md`; `TEMPLATE.md` is the starting point, `README.md` explains the convention

## Rules
- Never change `schema.prisma` without saying what the migration does. Every schema change ships with a migration that applies cleanly on both a fresh DB and the existing production DB.
- Point values per question come from the spec's point table, never from model output.
- All user-facing text goes through the existing translation mechanism and must exist in all three languages.
- Exam content is German; explanations, feedback and study material are in the learner's selected language.
- Never commit copyrighted exam material (official Modelltests, prep-book content). Reference exams live in a git-ignored folder.
- Don't refactor unrelated code. One feature per commit.

## Commands
- `npm run dev` — local dev (needs `DATABASE_URL`, `ANTHROPIC_API_KEY` in `.env`)
- `npm run lint` and `npx tsc --noEmit` — run both before every commit
- `npx prisma migrate dev` — create a migration locally
- `npx prisma db seed` — load the vocab list

## Workflow
1. Read the spec in `docs/specs/` I point you to.
2. Explore the relevant code and summarize what you found and what you assume.
3. Ask before building if anything is ambiguous, especially data-model changes.
4. Propose a plan, implement one feature at a time, lint + typecheck, commit, stop for review.
5. When the spec is finished: set its status to `done` and add an "Outcome" section with a short changelog and recommended follow-ups. Finished specs stay in `docs/specs/` as the project changelog.
6. If I correct you on something that will recur, tell me so I can add it to this file.
