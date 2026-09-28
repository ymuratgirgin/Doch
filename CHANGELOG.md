# Changelog

Newest first. One entry per release, meaning one sync to `main` (Vercel deploys `main`). Written in plain language for the app's owner. Work done through a spec has its detailed notes in that spec's Outcome section under `docs/specs/`. Entries before 2026-09-28 were reconstructed from the git history of `main`.

To add an entry: before syncing to `main`, put a new section at the top with the date, a short title and the commit hash once it is known, and list what changed for learners and for the owner. Mention anything the owner has to do after the deploy.

## 2026-09-28 — reference exams as private generation sources (`7b33d18`)
Spec: `docs/specs/2026-09-28-reference-exams.md`.

**Added**
- Three real practice exams (a telc Übungstest and two prep-book tests) are stored privately in the database and shape new exams: each generation call sees one stored section per requested part as a style and difficulty reference, then must invent everything new.
- An originality check compares generated parts with every stored exam text. A part that repeats more than 10% of a reference's 5-word sequences, or any 8-word run, is regenerated once; the learner is never blocked.
- 699 more B1 words from the Einfach gut lists, each with a German meaning, Turkish translation, two example sentences and grammar forms. They appear in flashcards, the vocab page and the "words tracked" total.
- `data/exam-difficulty-notes.md`: our own description of how hard each task type should be, awaiting review before it is used.
- `npm run import:reference` loads the private exams and vocabulary into the database from the git-ignored `reference/` folder.

**Changed**
- Speaking Teil 2 now shows both opposing opinion cards; you report your card and react to your partner's.
- The vocabulary hint sent to the model is drawn from the whole B1 bank. Before, only words from A to G could ever be chosen.
- Copyrighted reference files were removed from the public repository and its history; the folder is now git-ignored.

**Owner action**
- Run the production import once (done on 2026-09-28: 30 exam sections, 699 words).

## 2026-09-14 — real pause and resume for listening (`a3c2e42`)
- During an exam, pausing and resuming the listening audio no longer counts as a new play. Only starting again from the beginning uses one of the allowed plays.

## 2026-09-14 — replay after the exam, no names in the audio (`20edb95`)
- The results page has a play/pause listening player with unlimited replays after the exam.
- Titled or multi-word speaker names ("Frau Dr. …") are no longer read aloud by the voice.
- Interviewees no longer restate their own name in the middle of the interview.

## 2026-09-14 — statistics chart on mobile (`d96fc67`)
- The score trend chart is visible on phones (it collapsed to zero height on some browsers). The language switcher got a proper touch size.

## 2026-09-14 — website language switcher (`bd71ca0`)
- The site chrome (menus, buttons, headings, messages) can be switched between English, Turkish and German. Exam content, feedback and vocabulary stay in German, like the real exam.

## 2026-09-13 — listening and save fixes (`ffa40c5`)
- Real errors are shown when saving a generated exam fails. Hesitation sounds like "ähm" are removed before the voice reads a script.

## 2026-09-13 — richtig/falsch buttons and neutral statements (`a6381bd`)
- Every listening item always shows richtig/falsch buttons. Speaker names used only for voice casting are removed from the statements by code, not only by instruction.

## 2026-09-13 — listening text fixes (`af2b813`)
- Statements refer to "die Sprecherin" or "der Journalist" instead of invented names. "(Pause)" is no longer read aloud as "Punkt".

## 2026-09-13 — several voices for listening (`37ac955`)
- Each speaker in a listening text gets a different, gender-matched voice. TTS failures are logged with the real reason.

## 2026-09-13 — score breakdown and trend (`385d9fb`)
- A complete mock exam now appears in the statistics trend. A new exam history shows every finished exam with its per-part points.

## 2026-09-13 — reading Teil 2 answers (`869a91a`)
- The correct option in Leseverstehen Teil 2 must paraphrase the text instead of copying it, so the item tests understanding.

## 2026-09-13 — grading fix (`62435e1`)
- Multiple-choice answers were marked wrong when the model wrote the correct answer as a bare letter. Both sides are now compared the same way. A one-off script recomputes scores of exams graded before the fix.

## 2026-09-13 — spoken audio, Sprachbausteine layout, JSON repair (`3c3219c`)
- Listening audio through Google Cloud TTS, with the browser voice as fallback.
- Sprachbausteine look like the real exam: dropdowns at the gaps and a shared word bank under the letter.
- Generation recovers from badly quoted model output instead of failing.

## 2026-09-13 — item numbers (`69e80ed`)
- Item numbers were shown twice on many items; fixed.

## 2026-09-13 — mobile menu and error messages (`18b5be6`)
- The phone menu closes on scroll. Generation keeps the screen awake and shows a clear message instead of a raw browser error.

## 2026-09-13 — generation size (`d5a710b`)
- Reading and listening generation gets more room, and a too-long answer now gives a clear error instead of a confusing JSON message.

## 2026-09-10 — vocabulary statistic (`568e18b`)
- "Total tracked" in statistics shows the real vocabulary size instead of a number that grew each time the flashcards were opened.

## 2026-09-09 — Turkish vocabulary (`e33c08f`)
- All 1,812 B1 words have a Turkish translation and two example sentences, shown on flashcards and the vocab page. The vocab list sorts alphabetically and shows every word.

## 2026-09-07 — writing task and scoring (`a7ce0f7`)
- The writing task is one reply with four bullet points, without an item number.
- Unanswered questions now count against the score. Before, skipping most questions could still show 100%.
- Turkish translations on the flashcard reveal and in the "add word" lookup; A–Z bar on the vocab page.

## 2026-09-07 — exam experience and mobile (`f335f7d`)
- Reading Teil 3 ads look like real ads. The landing page shows the four tiles with login on the same page.
- Phone layout: hamburger menu, 44 px touch targets, no zoom when typing.
- Real progress bar while an exam is being generated.
- Streak counts only days with an exam or flashcard review. Item numbers follow telc's 1–60 numbering. Ad-matching answers are graded correctly. Login errors show a clear message.

## 2026-09-07 — generation stability and cost (`c99f88b`)
- Fixed generation failing with "Model returned no text content" and reduced cost with prompt caching and a cheaper model for single-word flashcard lookups.

## 2026-09-05 — rebrand, redesign, vocabulary details (`d41a06a`)
- The app is called Doch!. New mode picker, four-tile home page and a softer colour scheme.
- All 1,812 B1 words got German meanings, plurals and verb forms.
- Generation no longer times out at 60 seconds; deployments no longer fail on the database migration lock.
- Feedback and explanations are German only. Login names are case-insensitive, so "Murat" and "murat" are one account.

## 2026-09-03 to 2026-09-04 — first deployment
- The knowledge base files, the built app and the deployment settings (framework preset) were put on `main` so Vercel could deploy the site.
