# Reference exams and vocabulary as private generation sources

Status: in progress (built and verified locally; production rollout pending)
Date: 2026-09-28

## Goal

New mock exams are written with real telc Übungstest material and the Einfach gut B1 vocabulary lists as references, so they become more faithful and harder — while the copyrighted source files stay out of the public repository. This spec turns feature 6 of `2026-09-16-feature-batch-1.md` into a concrete plan based on what we found and decided while exploring it.

## Context

What we verified (2026-09-28), not assumed:

- **Generation today uses no exam text.** `src/app/api/exams/generate/route.ts` sends the system prompt (`prompts/exam-generation.md`), the blueprint `data/telc-b1-mock-generator-spec.md` (as a cached block) and a task block: weak areas, a vocabulary sample, JSON instructions. No reference exam content is included anywhere.
- **The vocabulary sample is much narrower than it looks.** The route does `prisma.vocabWord.findMany({ where: { level: "B1" }, take: 300 })` with no ordering, shuffles those 300 and sends only 60 words ("prefer these where natural, but do not force them"). "First 300 rows" are the words from "Abbildung" to "Gebühr" (letters A–G, checked on the local database). So roughly 1,500 of about 1,800 bank words never reach the model. This is a defect independent of everything else in this spec.
- **The vocabulary bank comes from a different source.** `data/B1_cleaned.json` (1,812 entries, definitions linked to DWDS) is seeded by `prisma/seed.ts` with source `goethe-telc-dwds`; the seed upserts by `(word, wordType, level)` and never deletes. The two Einfach gut PDFs are not used by the app at all.
- **`reference/` is a problem on `main`.** It is tracked there (commit `f06cf8b`: the Übungstest 1 PDF, an MP3, and the two Einfach gut PDFs), is not in `.gitignore`, and is absent from the working branch. The repository is public. The PDF's page 4 states "urheberrechtlich geschützt … Alle Rechte vorbehalten. © 2020 telc gGmbH" and requires the publisher's written consent for use beyond what the law allows. `CLAUDE.md` currently claims the folder is git-ignored, which is false.
- **There are three reference exams.** (1) The official telc Übungstest 1 (2020) as PDF plus MP3 — `telc_deutsch_b1_zd_uebungstest_4.mp3` is misnamed: the recording announces "Übungstest 1" and matches the PDF's printed Hörtexte (84–96% word-level similarity), so PDF and MP3 are the same exam. (2) and (3) Übungstest 1 and 2 of the prep book "Prüfungstraining telc Deutsch B1" (owner-supplied photos of Lesen, Sprachbausteine, the Hören items and Schreiben, an answer-key screenshot each, and one audio track each: Track 27 and Track 28). The book exams have no printed Hörtexte and no Sprechen pages; their audio was transcribed by speech-to-text (Track 27 checked: all 15 Hören answers consistent). Book publisher and exact title are not yet known.
- **Extraction works.** Private review copies exist outside the repo (delivered to the owner): the PDF as structured text with the parsed answer key (60/60 items; ad letters a–l checked against the key), a speech-to-text transcript of the MP3 (small errors; the PDF's printed Hörtexte are the authoritative wording), and the 994 vocabulary entries (579 in B1.1, 415 in B1.2; article/word/plural only, the example-sentence column is empty in every row; 294 already in the bank, about 700 new, 33 multi-word entries). The whole exam is about 30,000 characters (roughly 8–10k tokens).
- **The blueprint quotes the test.** `data/telc-b1-mock-generator-spec.md` lines 71, 75 and 76 contain three short verbatim quotes from Übungstest 1 (two statements, the Teil 1 intro line, the interview greeting). They were added to explain the "no invented names in statements" rule and are sent to the model on every generation.
- **Runtime constraint.** Vercel builds from GitHub, so git-ignored files are not deployed. Anything the live generator needs must come from the database (or another private store), not from `reference/`.
- **Claude has no audio input.** The MP3 cannot be sent to the model; only text derived from it can.
- Files to read first: `src/app/api/exams/generate/route.ts`, `src/lib/prompts.ts`, `src/lib/examSchema.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `data/telc-b1-mock-generator-spec.md` (§3, §3.6).

## Exploration to do first

Beyond the standard workflow in `CLAUDE.md`, find out and report:
- Token budget: how large an exemplar per Teil is, and how it interacts with the per-group `max_tokens` (writing/speaking 6000, reading 32000, listening 24000, others 16000) and with the existing prompt-cache block.
- Whether `main` is a protected branch on GitHub and whether a force-push is possible from this environment.
- How `UserVocabProgress`, flashcards (`src/lib/flashcards.ts`), the vocab page and the progress page's "words known / total tracked" depend on `VocabWord`, to judge what adding ~700 words would change for learners.
- How the listening scripts' "Herr/Frau <Name>:" label convention (spec §3.6, used by `src/lib/tts.ts`) should be shown in exemplars, since the real transcripts have no such labels (they use "J."/"S." or nothing).

Implement in the order below, one commit each.

## Requirements

### A. Repository hygiene (own commits, before any feature work)
1. `reference/` must be git-ignored and untracked on `main`, so nothing copyrighted stays tracked. The owner keeps the originals; I extract them before any history change and give the owner a copy.
2. Propose (not do) purging `reference/` from `main`'s history: back up the old `main` as a local bundle outside the repo, rewrite in a scratch clone, verify the new head's tree equals the old head's tree minus `reference/`, then force-push with lease **only after a separate explicit go-ahead**. Note the effects: 24 of 25 commits get new hashes, production redeploys, existing clones must reset, and GitHub may keep the old commits reachable by SHA until it garbage-collects them (copies in forks or caches cannot be recalled).
3. The three verbatim quotes in the blueprint must be replaced by invented examples that teach the same rule (neutral speaker wording in statements; a shared survey question for Teil 1; only the journalist names the guest in Teil 2). Generation behaviour must be unchanged apart from the wording of the examples.
4. `CLAUDE.md` must state the truth about `reference/`, and the `main` sync procedure must stop restoring `reference/` from `main`.

### B. Private reference store
5. Reference exams must be stored privately in Postgres. Propose the schema (for example one row per Teil with exam label, source, Teil, kind, text as structured JSON, answer key, difficulty notes). The migration must be described before it is applied and must apply cleanly on a fresh database and on the production database.
6. An import script reads a git-ignored local folder and loads the store. It must be re-runnable (idempotent) and must not need the PDFs at runtime. The reviewed extraction output is the input format to formalize.
7. Only text is stored. The MP3 is not stored or used at runtime; it only informs notes about spoken structure (announcements, reading pauses, once/twice playing).

### C. Use in generation
8. Each generation call must include one or two exemplars of the same Teil type(s), clearly labelled as style/difficulty references, with an instruction to invent new content and not reuse text, names or numbers. Propose the selection strategy, a token cap per exemplar, and how to keep them inside a cache block.
9. Generation must keep working, unchanged, when the reference store is empty.
10. Originality check (measure and threshold decided, see Open questions): generated items that overlap a reference above the threshold are regenerated once and logged. Report the effect on latency once measured.
11. Point values stay assigned by our own table, never from model output (existing rule).
12. Propose a difficulty note per task type (text length, distractor style, lexical level) derived from the exemplar, kept as our own text in committed files. Designing the "reject items that are too easy" step is in scope; implementing it is a follow-up.

### D. Vocabulary
13. Fix the sampling defect: the generator's vocabulary sample must be drawn from the whole B1 bank, not the first 300 rows. Propose the query and the sample size.
14. The Einfach gut B1.1/B1.2 lists (994 entries) become part of the B1 bank as additional `VocabWord` rows, so they appear in flashcards, on the vocab page and in "words known / total tracked", **and** are available to generation. **Decided 2026-09-28** (owner: "add those missing words to flashcards as well"). They are imported privately by the same path as the exams (script reading a git-ignored local folder, not added to the public `data/B1_cleaned.json`). Entries already in the bank (about 294) are skipped, never overwritten. Each new row carries a distinct `source` (proposal: `einfach-gut-b1`) so the batch can be identified, filtered or removed later, and `level` `B1`.
15. Every imported word must meet the same flashcard requirements as the existing bank, because the source lists give only article, word and plural: `meaning` (short German definition), `translationTr`, two `exampleSentences`, `wordType`, `article` and `plural` for nouns, and `pastParticiple` / `auxiliaryVerb` / `praeteritum` for verbs. This text is written by us (not copied from the lists) and stored in the private database. Propose how it is produced and reviewed (for example in batches, written to a git-ignored file first, spot-checked by the owner, then imported), the handling of the 33 multi-word entries (keep as expressions or drop) and of very course-specific words, and how the `(word, wordType, level)` uniqueness key is matched when the list has no word type. State the consequences: "total tracked" grows by about 700 and new words start as "new" for every user.

### E. Documentation
16. Update `CLAUDE.md` (private store, import command, corrected rules) and README's "How it works".

## Open questions
Answer or ask about these before writing code for the relevant requirement:
- ~~Where should the store live?~~ **Decided 2026-09-28: Postgres** (private by default, deployed with the app, no new service).
- ~~Purge `main`'s history now, or only untrack?~~ **Done 2026-09-28:** `main` was rewritten without `reference/` (new head `a3c2e42`, 25 commits, tree identical to the old head minus `reference/`) and force-pushed with lease after the owner's explicit go-ahead. Backup bundle and the four original files are kept outside the repo.
- ~~Is `main` protected, and can the owner or I force-push?~~ **Answered:** not protected; the force-push from this environment worked.
- ~~Is there a second exam?~~ **Yes (2026-09-28): two more, from the prep book.** Design for many exams; rotate between exams per Teil.
- ~~Legal: is feeding third-party exam text into prompts acceptable use?~~ **Owner's decision 2026-09-28: proceed.** The texts stay private (Postgres only, never in the repo or UI); the owner notes there is currently no commercial use and accepts the residual risk. Revisit before any commercial use or public launch.
- ~~Vocabulary: should the ~700 new words appear in flashcards and statistics, or only feed generation?~~ **Decided 2026-09-28: they appear in flashcards, the vocab page and statistics too, fully enriched (meaning, Turkish translation, two example sentences, grammar forms).**
- ~~Originality threshold and how strict the regenerate-once rule should be.~~ **Decided 2026-09-28:** measure overlap on German word 5-grams per generated text against every stored reference text; more than 10% of a text's 5-grams found in a reference, or any single run of 8 identical words, triggers one regeneration of that Teil and a log entry. If the second attempt still overlaps, keep the version with less overlap and log it; the learner is never blocked. String check only, no extra model call.
- ~~Who supplies the per-task difficulty notes?~~ **Decided 2026-09-28:** Claude derives them from the reference exams (text length, distractor style, lexical level) as our own text in committed files; the owner reviews them before they are used.

## Out of scope
- Collecting or adding more reference exams (separate follow-up once the mechanism works).
- Implementing the "too easy" rejection step (design only here).
- Changes to grading, the speaking mode, new exam parts, or the batch-1 features 1–5.
- Any UI change.

## Definition of done
- `reference/` ignored and untracked; the three quotes replaced; the history purge either done after the separate go-ahead or explicitly deferred by the owner.
- Migration applies cleanly on a fresh database and on the existing production database.
- Import script loads the Übungstest 1 text, its answer key and the vocabulary lists; re-running changes nothing.
- Generation works with and without reference data; exemplars appear in the task block; the originality check rejects a synthetic near-copy in a check.
- The vocabulary sample covers the whole bank (verified on the letter distribution).
- `npm run lint` and `npx tsc --noEmit` pass; no regression in generate → take → submit → grade.
- `CLAUDE.md` and README updated; this file set to `done` with an Outcome section.

## Outcome

Built on 2026-09-28, one commit each on the working branch:

- `main` history purged of `reference/` (new head `a3c2e42`, tree identical to the old head minus `reference/`), backup bundle kept outside the repo.
- `89fdf26` git-ignore `/reference/`; `c2127f1` the three verbatim quotes in the blueprint replaced by invented examples; `f3da52e` `CLAUDE.md` states the truth about `reference/`.
- `b970fcb` vocabulary hint drawn from the whole B1 bank (60 distinct words, unbiased shuffle). Before: only letters A–G, 300 reachable rows; after: every letter in proportion to the bank.
- `37e2b1c` table `ReferenceSection` (additive migration `20260928213000_add_reference_section`) and `scripts/import-reference.ts` (`npm run import:reference`, idempotent, `--dry-run`). `0cd6dd8` adds the telc speaking sections.
- `5b16a77` one random reference section per requested Teil goes into the task block as a labelled style/difficulty exemplar (empty store or database error: prompt unchanged). `ce303da` speaking Teil 2 now shows both opposing cards. `b043b70` originality check: more than 10% shared 5-word sequences or any 8-word run triggers one regeneration of that Teil, the less similar version is kept.
- `8b25fab` the same import adds vocabulary lists; 699 Einfach gut words are enriched (German meaning, Turkish translation, two examples, grammar forms) and load as `VocabWord` rows with source `einfach-gut-b1`, so they appear in flashcards, the vocab page and "words tracked" (1,806 → 2,505).
- `7dd601d` `data/exam-difficulty-notes.md` (our own text, awaiting the owner's review) with a design for a later "too easy" check.

What changed from the plan:
- Three reference exams instead of one: the telc Übungstest 1 (PDF and audio) plus two prep-book Übungstests (photos, answer keys, audio transcribed by speech-to-text). Only the telc exam has speaking tasks.
- The vocabulary batch is 699 words, not about 700 or 994: of the 994 list entries 276 were already in the bank, 17 gender pairs (for example "Bewohner/in") duplicate a base word already there, and 2 entries repeat inside the list. Seven entries came from PDF extraction errors ("fl" ligature) and were corrected; brackets like (DZ) and (Pl.) moved into the meaning; four true multi-word entries are stored as `phrase`.
- Exemplars sit after the cached specification block, not inside it, because they are picked at random per call.
- The owner decided to proceed with private use of the third-party texts (no commercial use); revisit before any commercial use or public launch.

Verified: `npm run lint`, `npx tsc --noEmit`; migrations apply on a fresh database with no schema drift; import and re-import change nothing; empty-store and database-down paths return no exemplars; originality check flags verbatim and lightly edited copies, passes an invented text, and flags none of the real exams compared against each other (worst overlap 0.8%); vocabulary import tested on a throwaway seeded database (update, skip and idempotency).

Not verified: a live generation call (no `ANTHROPIC_API_KEY` in the build environment), so the exemplar and originality log lines and the two-card speaking screen still need one look on a real run.

Rollout still to do (the spec is set to `done` after these):
1. Sync the working branch to `main` (Vercel runs the new migration on deploy).
2. Run `npm run import:reference` once against the production `DATABASE_URL` from the machine that has `reference/`.
3. Generate one exam and one speaking practice and check the Vercel logs for `[exam-generate] exemplars=` and `originality` lines.

Recommended follow-ups:
- Owner reviews `data/exam-difficulty-notes.md` and the Turkish translations; then add the notes to the generation prompt and implement the "too easy" check.
- Flashcards choose unstudied words in database order, so the 699 new words reach learners after the older ones; interleave them if that is unwanted.
- More reference exams and any Sprechen tasks from the book; with more exams the random pick gets more varied.
- The blueprint says speaking cards of 40–60 words, the real ones are 34–37; consider adjusting §3.8.
- Three code comments still mention the invented name "Frau Dr. Seiffert" as an example label; harmless, can be renamed.
