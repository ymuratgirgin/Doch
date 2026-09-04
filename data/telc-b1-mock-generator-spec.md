# telc B1 Mock Exam Generator — Specification

Purpose: this document is a complete instruction set for generating original, faithful telc Deutsch B1 mock exams. It can be used as project instructions for an AI assistant or as a spec for a practice app. Everything is based on the official telc Übungstest format (2019/2020 revision) and the official scoring rubrics.

**Golden rule:** never copy text, ads, questions, or listening scripts from official telc tests or third-party mocks. Generate 100% original content that follows the *format* rules below exactly.

---

## 1. Exam blueprint (fixed — never deviate)

| Subtest | Teil | Task type | Items | Points | Time |
|---|---|---|---|---|---|
| Leseverstehen | 1 | Match 5 texts to headlines a–j | 1–5 | 25 | 90 min shared (Lesen + Sprachbausteine) |
| Leseverstehen | 2 | 1 long article, MC with a/b/c | 6–10 | 25 | |
| Leseverstehen | 3 | Match 10 situations to ads a–l or x | 11–20 | 25 | |
| Sprachbausteine | 1 | Letter, 10 gaps, MC a/b/c (grammar) | 21–30 | 15 | |
| Sprachbausteine | 2 | Letter, 10 gaps, word bank a–o (vocabulary) | 31–40 | 15 | |
| Hörverstehen | 1 | 5 short monologues, richtig/falsch, played ONCE | 41–45 | 25 | ~30 min total |
| Hörverstehen | 2 | 1 long interview, richtig/falsch, played twice | 46–55 | 25 | |
| Hörverstehen | 3 | 5 short announcements, richtig/falsch, played twice | 56–60 | 25 | |
| Schriftlicher Ausdruck | — | Reply e-mail covering 4 Leitpunkte | 1 task | 45 | 30 min |
| Mündlicher Ausdruck | 1–3 | Paired oral exam | 3 parts | 15+30+30 | ~15 min (+20 min prep) |

- Written total: 225 points. Oral total: 75 points. Pass = ≥60% in each independently (135 written, 45 oral).
- Grades: 270–300 sehr gut · 240–269.5 gut · 210–239.5 befriedigend · 180–209.5 ausreichend · <180 nicht bestanden.
- Numbering is continuous across the written exam (1–60). Keep it.

## 2. Language level & topic pool

- Vocabulary: stay within CEFR B1 core (~2,400 words, cf. official Goethe/telc B1 Wortliste). A handful of B1+ words per text is authentic and fine (e.g. officialese like "Bußgeld"); they must never be what an answer hinges on unless context makes them inferable.
- Grammar ceiling: Perfekt/Präteritum, Nebensätze (weil, dass, obwohl, während, wenn), Relativsätze, Passiv Präsens, Konjunktiv II (würde/könnte/wäre/hätte), Komparativ/Superlativ, Präpositionen mit Dativ/Akkusativ/Genitiv (wegen, trotz).
- Topic pool (rotate; these are the authentic telc domains): work & careers, education/training, health, travel & transport, housing & neighbourhood, family & relationships, leisure/sport/culture, consumer topics (shopping, complaints, services, insurance), media & technology, environment, food & restaurants.
- Register: everyday, realistic Germany/Austria/Switzerland settings. Invent all names, companies, phone numbers, addresses, prices.

## 3. Generation rules per section

### 3.1 Leseverstehen Teil 1 (items 1–5)
- Write **5 short texts**, 50–90 words each: press briefs, service announcements, consumer notices. Each has ONE clear main point.
- Write **10 headlines (a–j)**: 5 correct, 5 distractors.
- Distractor design (this is what makes it telc-like): each distractor must share topic vocabulary with one of the texts but mismatch the actual main point. Pairs of near-miss headlines on the same theme are required (e.g. text about a newspaper-delivery holiday service → distractor "Reading on holiday: a new trend").
- Each headline usable once. Instruction line: "Lesen Sie die Überschriften a–j und die Texte 1–5. Finden Sie für jeden Text die passende Überschrift."

### 3.2 Leseverstehen Teil 2 (items 6–10)
- Write **1 article**, 300–400 words, journalistic human-interest or reportage style (a project, an initiative, a trend, a portrait), with a headline and optional sub-headline.
- Write **5 MC questions**, options a/b/c, **in text order**. Each question stem is a sentence-completion or direct question.
- Wrong options must be *plausible*: recycle words that appear in the text but distort the relationship (who/what/why/how many). Exactly one option is defensible from the text.
- Include at least one question on a number/quantity, one on a reason/purpose, and one on the intention of a person in the text.

### 3.3 Leseverstehen Teil 3 (items 11–20)
- Write **10 situations** (1–2 sentences each, "Sie möchten … / Ihr Sohn braucht …") and **12 short ads (a–l)**: classifieds, flyers, small display ads with realistic fragments (opening hours, prices, phone numbers, abbreviations like z. B., inkl., Tel.).
- **Exactly 2 situations must have NO matching ad → correct answer "x".** This is mandatory; a mock without x-items is not faithful.
- Include near-miss ads: e.g. two restaurants where only one has outdoor seating; two flight ads where only one mentions student fares.
- Instruction must state: "Wenn Sie zu einer Situation keine Anzeige finden, markieren Sie ein x."

### 3.4 Sprachbausteine Teil 1 (items 21–30)
- Write an **informal letter/e-mail (du-form)**, ~120–150 words, with 10 numbered gaps.
- Each gap: 3 options (a/b/c), **grammar-focused**. Cover a spread of: conjunctions (aber/denn/sondern; weil/obwohl/damit), article/adjective endings, verb forms & tenses, auxiliary choice (bin/habe), relative pronouns (die/denen), possessives, personal pronouns (dir/Ihnen — register trap), prepositions (in/nach/bis).
- All three options must be the same word class; only one fits grammatically/contextually.

### 3.5 Sprachbausteine Teil 2 (items 31–40)
- Write a **semi-formal letter (Sie-form)**, ~130–160 words — an inquiry, complaint, booking, application reply — with 10 numbered gaps.
- Provide a **word bank of 15 words (a–o), UPPERCASE, alphabetical**; 10 fit the gaps, **5 are unused leftovers**. Each word usable once.
- Focus is lexical-functional: connectors (deshalb, schließlich, außerdem), fixed collocations (interessiere mich FÜR, DANKBAR wenn), modal forms (könnten, müssten), subordinators (damit, wenn, da).
- Leftover words must be tempting near-synonyms or same-class words (e.g. include both DAMIT and DESHALB, WANN and WENN).

### 3.6 Hörverstehen (items 41–60)
**Primary workflow:** the generator writes full scripts; the learner converts them to audio with an online text-to-speech app, then answers while listening. Scripts must therefore be TTS-ready:
- Output each Teil's script as its own clearly delimited block ("Hörtext Teil 1", etc.), containing ONLY the words to be spoken — no task instructions, no item statements, no stage directions inside the block.
- Separate speakers/segments so they can be pasted as individual TTS clips: in Teil 1 and Teil 3, label segments "Text 41" … "Text 45" (one clip each); in Teil 2, prefix turns with speaker names (e.g. "Journalist:" / "Frau Weber:") — ideally converted as two alternating voices, or as one clip if the app supports only one voice.
- Mark pauses with a line break and "(Pause)" between segments; the learner inserts silence or simply pauses playback there.
- Keep spoken-language features (na ja, ehm, contractions) light enough that TTS pronounces them naturally.
- Place the richtig/falsch statements OUTSIDE the script blocks (with the tasks), and remind the learner to generate/play audio per the exam rules: Teil 1 once, Teil 2 and 3 twice.
- **Teil 1 (41–45):** 5 unrelated short monologues (40–80 words each) by different everyday speakers on one shared survey question (e.g. "Wie teilen Sie sich die Hausarbeit?"). Natural spoken features: ehm, na ja, contractions. 1 richtig/falsch statement per speaker. Header must say the texts are heard **only once** and give 30 seconds to pre-read.
- **Teil 2 (46–55):** one interview (~450–600 words), radio style: journalist + expert/interesting person (club anniversary, unusual job, local project). 10 richtig/falsch statements in interview order. Mix clearly-stated facts with statements that contradict a detail (numbers, who does what, since when). Heard twice; 60 seconds pre-reading.
- **Teil 3 (56–60):** 5 unrelated public/service texts: directions on the phone, cinema program, weather report, train/airport announcement, store/radio advertisement. 1 richtig/falsch statement each, hinging on a specific detail (street name, time, price, region). Heard twice.
- Falsch statements must be *specifically* contradicted by the script — never merely unmentioned.
- Target ratio: roughly half richtig, half falsch, no more than 3 of the same in a row.

### 3.7 Schriftlicher Ausdruck
- Provide an **incoming e-mail** (personal from a friend, or semi-formal from an organisation/landlord/course provider), ~80–120 words, that naturally raises questions.
- Provide **exactly 4 Leitpunkte** (bullet points) the answer must cover.
- Instruction: reply covering all four points, with fitting Betreff, Anrede, Einleitung, Schluss; recommend the test-taker chooses a sensible order. Target length ~120–150 words, 30 minutes.
- Match register of the reply to the incoming mail (du vs. Sie).

### 3.8 Mündlicher Ausdruck
- **Teil 1 — Einander kennenlernen (~3 min):** prompt sheet with keyword topics (Name, Wohnort/Wohnung, Familie, Beruf/Studium, Sprachen, plus 1–2 extras like Wochenende/Hobbys).
- **Teil 2 — Über ein Thema sprechen (~6 min):** ONE topic, TWO cards. Each card = a fictional person (name, age, job) with a 40–60-word quoted opinion; the two opinions must clearly conflict (pro vs. contra). Task text: report your card, then discuss, give your own opinion and experiences.
- **Teil 3 — Gemeinsam etwas planen (~6 min):** one planning scenario (party, excursion, farewell gift, course event, visit program) plus a checklist card: Wann? Wo? Essen/Getränke? Wer macht was? Wer bezahlt? … Task: propose, react, justify, agree on a plan.

## 4. Answer key & scoring (must be included with every mock)

- Key format: item number → letter (Teil 3 may include x) or +/− for richtig/falsch. Place at the END of the document, clearly separated ("Lösungsschlüssel").
- Objective sections: Lesen 3.75 pts/item; Sprachbausteine 1.5 pts/item; Hören 3.75 pts/item (so each Teil totals per the blueprint table).
- Writing rubric (official 3-criteria system, each graded A/B/C/D = 5/3/1/0, sum ×3, max 45):
  - **I Aufgabenbewältigung:** A = all 4 Leitpunkte adequately covered; B = 3; C = 2; D = 0–1. Off-topic entirely → D in all criteria.
  - **II Kommunikative Gestaltung:** structure, connectors, register, e-mail text features. Do not award A if content points sit unconnected side by side, if register is wrong/inconsistent, or if most sentences begin with Ich/Wir.
  - **III Formale Richtigkeit:** comprehensibility first — errors that don't block understanding still allow A/B.
- Speaking rubric: each Teil scored on 4 criteria — Ausdrucksfähigkeit, Aufgabenbewältigung (conversation participation, strategies, fluency), Formale Richtigkeit, Aussprache/Intonation. Per-criterion points: Teil 1 max 4/4/4/3; Teil 2 and Teil 3 each double (8/8/8/6). A monologue delivered without reacting to the partner scores low on Aufgabenbewältigung even if language is good.

## 5. Quality checklist before delivering a mock

1. Item counts and numbering (1–60) match the blueprint exactly.
2. Lesen Teil 3 contains exactly two x-answers.
3. Sprachbausteine Teil 2 word bank has 15 words, 5 unused, alphabetical, uppercase.
4. Every falsch statement in Hören is contradicted by the script, not just absent.
5. Distractors share vocabulary with texts (no giveaway keyword matching).
6. All content is original — no reused telc/third-party texts, names, or numbers.
7. Vocabulary and grammar stay within the B1 ceiling (§2).
8. Answer key present, separated, complete; writing/speaking rubrics attached.
9. Instructions (Arbeitsanweisungen) are in German, in official phrasing style; they may be followed by a short English gloss if the learner wants it.
10. Timing labels printed on each section (90 min / ~30 min / 30 min / ~15 min).

## 6. Delivery modes

- **Document mode:** full exam as a single file, sections in official order, key at the end.
- **Interactive mode (chat):** serve one Teil at a time, collect answers, score immediately using §4, then give per-item explanations. For writing: grade against the 3 criteria and show which Leitpunkte were covered. For speaking: roleplay as the partner (Teil 1–3), then self-assess against the 4 criteria.
- **Listening delivery:** always output the script in a separate, TTS-ready block (see §3.6) distinct from the statements. Default path: the learner converts the script to audio with an online TTS app and answers while listening, only reading the script afterwards for review. Fallbacks: someone reads it aloud, or it's used as transcript-based practice.

## 7. Difficulty calibration

- The reference difficulty is the official Übungstest. If the learner scores >85% consistently, raise difficulty *within B1* (longer sentences, subtler distractors, more inference) — never by importing B2 grammar/vocabulary.
- Track per-Teil scores across mocks; generate targeted single-Teil drills for anything under 60%.
