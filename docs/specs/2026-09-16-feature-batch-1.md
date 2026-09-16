# Feature batch 1 — review, retake, localized explanations, stats exclusion, Study page, better sources

Status: open
Date: 2026-09-16

## Goal

After this batch a learner can review any finished exam question by question, retake an exam as a new attempt, read every mistake explanation in their own language, control which attempts count toward their statistics, and study their weak grammar topics on a dedicated page. Separately, we agree on how to feed more reference exams into generation so mocks become harder and more faithful.

## Context

Stack details and rules are in `CLAUDE.md`. The parts this batch touches:
- `prisma/schema.prisma` — data model (Attempt, PersonalVocabWord, etc.)
- `data/telc-b1-mock-generator-spec.md` — the telc B1 blueprint generation follows
- `prompts/` — system prompts for generation and grading
- `src/app/api/exams/generate`, `src/app/api/attempts/[id]/submit` — generation and grading routes
- `src/lib/weakAreas.ts`, `passEstimate.ts`, `flashcards.ts`, `streak.ts`, `recommendation.ts`
- `src/app/` — home page (doubles as landing/dashboard/login), exams, vocab, flashcards, mistakes, progress pages

The UI currently supports three languages. Wrong answers already get a cached grammar/topic explanation with examples at grading time.

## Exploration to do first
Beyond the standard workflow in `CLAUDE.md`, specifically find out and report:
- How the three UI languages are implemented: where the language is stored per user, how UI strings are translated, and whether the cached mistake explanations are language-aware today.
- Whether any of history, statistics, streak, weak-area detection or pass estimate assume one attempt per exam.
- How the single example exam and `data/telc-b1-mock-generator-spec.md` are fed into the prompts in `prompts/`.

Implement the features **in the order below**, one at a time.

## Requirements

### 1. Post-exam review
After submitting, the learner can open a full review of that attempt:
- Every question with the learner's answer and the correct answer, marked right/wrong; for writing and speaking, show the rubric feedback.
- Navigable per part (Leseverstehen, Sprachbausteine, Hörverstehen, Schriftlicher Ausdruck, and speaking where applicable) with a per-part score summary at the top.
- Reachable later from exam history, not only right after submitting.
- For listening, the review may show the transcript/script alongside the questions.

### 2. One attempt per exam, with explicit retake
- A generated exam can be taken once; once completed it shows as completed with its score and cannot be silently restarted.
- Add a **"Retake exam"** button that creates a **new Attempt** on the same exam. Previous attempts stay stored and reviewable.
- History, statistics, streaks, weak-area detection and pass estimate must treat each Attempt as its own record. Tell me if any of these currently assume one attempt per exam.

### 3. Mistake explanations in the learner's selected language
- Exam content stays in German. Every explanation of *why an answer is wrong and what the rule is* must be in the learner's selected UI language.
- Check how explanations are produced and cached today. Propose the cleanest way to make them per-language (e.g. cache keyed by `(question, language)`, generated on demand for the active language) with the trade-offs in API cost, latency and storage, then implement after I confirm.
- Switching language must switch explanations without losing any data; already-cached explanations in other languages should not be regenerated needlessly.

### 4. Statistics: exclude selected attempts
- On the progress/statistics page, the learner can deselect any attempt so it is excluded from the overall success rate, the per-skill trend chart, and the pass estimate.
- Exclusion is persisted (per user, in the DB) and there is an "include all" reset.
- Excluded attempts remain in history and reviewable; only aggregates change. Decide with me whether weak-area detection and recommendations should also respect exclusions.

### 5. Dedicated Study page
Extend the current mistakes page into a proper **Study** page:
- Content is derived from the learner's actual mistakes across all attempts.
- Mistakes are grouped by underlying grammar/vocabulary topic (e.g. Präpositionen mit Dativ, Konjunktiv II, Nebensätze, Wortschatz Arbeit). Propose whether topics should be tagged at generation time, at grading time, or classified afterwards, and how to keep the topic list stable so the same rule isn't split into five slightly different names.
- Each topic gets: an explanation of the rule in the selected language, several fresh German example sentences with translations, and a link back to the specific mistakes that triggered it.
- The page updates as new mistakes come in; topics the learner has since answered correctly move down or are marked as improving.
- Reuse the existing explanation cache where possible so this doesn't double the API cost.

### 6. More source material for harder, more faithful exams
Generated exams are too easy because generation is grounded in a single example plus the spec. This is a design task first:
- Inspect how the example exam is stored and how it and `data/telc-b1-mock-generator-spec.md` feed the prompts in `prompts/`.
- Propose a folder layout and format for **multiple** reference exams (official telc/DTZ Modelltests plus ones I add), with per-task difficulty metadata.
- Propose how generation should draw on several references (few-shot sampling, per-task-type exemplars) and how to calibrate difficulty: a difficulty rubric per task type (text length, distractor plausibility, lexical range against the B1 word list), plus a check step that rejects items that are too easy.
- Do **not** commit copyrighted exam content; reference material goes in a git-ignored folder or external storage unless I say it's freely licensed. Deliver a written proposal and scaffolding; we'll fill in the exams together.

## Open questions
Answer or ask about these before writing code for the relevant feature:
- Feature 3: how should per-language explanations be produced and cached — cache keyed by (question, language) generated on demand, or all three languages at grading time? Give the cost/latency/storage trade-off.
- Feature 4: should weak-area detection and recommendations also respect excluded attempts, or only the aggregate statistics and pass estimate?
- Feature 5: should topic tagging happen at generation time, at grading time, or by classifying mistakes afterwards? How do we keep the topic taxonomy stable?
- Feature 5: should the Study page respect the exclusions from feature 4?
- Feature 6: where should reference exams live — git-ignored folder in the repo, or external storage?

## Out of scope
- Actually collecting and adding new reference exams (separate follow-up spec after feature 6's proposal is agreed).
- Changes to exam generation difficulty beyond the proposal in feature 6.
- Any new exam parts, vocabulary features, or flashcard changes.

## Definition of done
- Features 1–5: implemented, reviewed and committed one by one.
- Feature 6: written proposal (format, folder layout, sampling and difficulty calibration) agreed with me, plus the scaffolding we decide on (folder, loader, prompt changes). Filling in the reference exams is a separate follow-up spec.
- Migrations apply cleanly on a fresh DB and on the existing production DB.
- No regressions in generate → take → submit → grade.
- New strings present in all three languages.
- This file updated: status set to `done`, and an "Outcome" section added at the bottom with a short changelog and recommended follow-ups.

## Outcome
(Filled in by Claude Code when the spec is done.)
