# Telc B1 Trainer

A web app for practicing the Telc B1 German exam: generates fresh mock
exams with Claude and gives instant, LLM-graded feedback on answers.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + SQLite (via `@prisma/adapter-better-sqlite3`)
- `@anthropic-ai/sdk` for exam generation and answer evaluation

## Status

This is an early scaffold. Two pieces are still placeholders and need
real content before generation/grading are trustworthy:

- `prompts/exam-generation.md` and `prompts/answer-evaluation.md` are
  generic stand-ins for the user's own exam-prep spec (structure,
  difficulty targets, section weighting, grading rubric).
- The vocabulary bank (`VocabWord` table) is empty. Wire up
  `prisma/seed.ts` to import the Telc/Goethe B1 word list once it's
  available, then run `npx prisma db seed` (or `npm run db:seed` if
  you add that script).

## Getting started

```bash
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `prisma/schema.prisma` — data model: `VocabWord`, `Exam` / `ExamPart` /
  `Question`, `Attempt` / `Answer`.
- `src/app/api/exams/generate` — calls Claude to generate a new exam and
  persists it.
- `src/app/api/attempts/[id]/submit` — auto-grades objective questions,
  sends free-text answers to Claude for evaluation, stores per-question
  and overall feedback.
- `src/app/{,vocab,exams}` — dashboard, vocabulary browser, exam list /
  take / results pages.
