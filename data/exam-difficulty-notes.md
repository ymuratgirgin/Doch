# Difficulty notes per task type

Our own description of what makes a real telc B1 written and listening task hard enough, derived from three reference exams (one telc Übungstest, two prep-book Übungstests). It contains measurements and patterns only — no exam text. The notes are **not yet used by the generator**: the owner reviews them first, then they can be added to the generation prompt and used for the "too easy" check described at the end.

Numbers are word counts (whole words, gap markers and item numbers excluded) and cover all three exams unless stated. The blueprint (`telc-b1-mock-generator-spec.md`) stays the authority for structure and point values; these notes only calibrate difficulty inside it.

## Leseverstehen Teil 1 — headings to texts (items 1–5)
- **Size:** 10 headings of about 6–7 words, 5 texts of 42–87 words (usually 50–65). Five headings are unused.
- **Correct heading:** an abstraction of the text (a summary noun phrase or a trend), never a copy of the text's own key words.
- **Distractors:** at least three of the five unused headings share a topic word or theme with a text but describe a different aspect (opposite trend, other target group, other stage). A learner who matches keywords picks a distractor.
- **Texts:** each has one main point but carries numbers or details that fit a second heading.

## Leseverstehen Teil 2 — article and multiple choice (items 6–10)
- **Size:** one article of 300–342 words in five to seven short paragraphs, with a title, named people, one place and two or three numbers. Stems are short; options are 4–7 words.
- **Order:** the five items follow the order of the text.
- **Distractors:** each wrong option is either a true detail from the text that answers a different question, or a plausible general statement the text does not make. Exactly one option is supported.
- **Inference:** at least one item needs a small inference (comparing two numbers, or a reason stated in one place and a result in another), not a lookup.
- **Key balance:** in the three exams, a, b and c each appear one or two times; no letter appears more than twice.

## Leseverstehen Teil 3 — situations and ads (items 11–20)
- **Size:** 10 situations of 14–17 words, 12 ads. Ads are mostly 33–48 words, with a few shorter ones and one or two up to 75.
- **Ads:** they come in domain clusters (for example four or five sport and fitness offers, or several holiday offers), so a situation can only be matched on a specific condition: target group, day or time, place, format (online or on site, alone or in a group), price or booking rule.
- **No-match items:** one or two situations have no ad (answer x). Each no-match situation has a near-miss ad that fits on topic but fails one stated condition.
- **Unused ads:** two or three ads are never the answer and should still look attractive.

## Sprachbausteine Teil 1 — informal letter with three-way choice (items 21–30)
- **Size:** 139–151 words with ten gaps; du-form; personal news, holiday, moving or invitation.
- **Gap mix:** at least five different grammar areas among the ten gaps, for example conjunction choice, case of an article or pronoun, adjective ending, modal or auxiliary form, participle or infinitive, preposition, word order or time expression.
- **Options:** all three are real forms of the same word or close relatives, so only the sentence context decides. Correct letters are spread over a, b and c.

## Sprachbausteine Teil 2 — semi-formal letter with word bank (items 31–40)
- **Size:** 154–194 words with ten gaps; Sie-form; inquiry, application, booking or complaint.
- **Word bank:** 15 words in capitals, alphabetical, five unused. Unused words are same-class or near-synonym traps (two connectors with different logic, two prepositions, two question words, a verb form that fits grammatically but not in meaning).
- **Gap mix:** connectors and adverbs, prepositions, question words or subordinators, and verb forms (participle, reflexive verb). At least one gap needs a whole collocation, not a single word.

## Hörverstehen Teil 1 — five short statements (items 41–45)
- **Size:** about 70 words per speaker (353–357 in total), plus a short introduction naming one shared question; statements of 7–10 words.
- **Statements:** each checks an attitude, preference, reason or habit of one speaker; false ones reverse it or attach it to the wrong speaker. Key: two or three richtig.
- **Language:** natural spoken register with small digressions, so the point is not in the first sentence.

## Hörverstehen Teil 2 — interview (items 46–55)
- **Size:** 459–608 words of continuous dialogue between an interviewer and one guest; ten statements of about 9–10 words in interview order.
- **Statements:** true ones paraphrase a fact; false ones change a number, a person, a frequency or a condition, or use a detail from another part of the interview. Key: exactly five richtig and five falsch in all three exams.
- **Dialogue:** the interviewer names the guest once at the start; the guest never says their own name. Answers give rules, numbers or examples so that statements can hinge on details.

## Hörverstehen Teil 3 — five short public texts (items 56–60)
- **Size:** 315–335 words in total, about 60–75 per text; each introduced by one sentence that sets the situation (announcement, weather report, answering machine, advert, message).
- **Statements:** each hinges on one detail such as a day, a place, a start time, a platform or who has to act. Key: two or three richtig.

## Schriftlicher Ausdruck
- **Task email:** 90–98 words that raises two direct questions, adds an offer or request, and ends with a request to reply; four Leitpunkte that answer the questions and cover an opinion or suggestion.
- **Length:** the expected answer is about 120–150 words.

## Mündlicher Ausdruck (telc exam only)
- **Teil 1:** seven prompt topics on the person plus two optional extra topics for the examiners.
- **Teil 2:** one topic and two cards of 34–37 words each with opposing opinions, an author line (name, age, job). The blueprint says 40–60 words; the real cards are shorter, so 35–45 is closer to the exam.
- **Teil 3:** a planning scenario plus a checklist of five short questions and an open final point, then four fixed procedure steps (propose, react, justify, agree).

## Vocabulary
- Everyday B1 vocabulary; a few B1+ words per text are normal. Items never hinge on a rare word: the tested idea can be understood from context even if one word is unknown. Words from the learner's vocabulary hint (whole B1 bank plus the Einfach gut list) are preferred where natural.

## Design for a "too easy" check (not implemented)
A later step can reject a generated Teil before it reaches the learner, using cheap rules first and a model judge only when the rules pass:
1. **Length band:** the text is inside the ranges above (allow ±20%).
2. **Key balance:** no letter appears more than the counts above; richtig/falsch within 2:3 to 3:2 for Teil 1 and 3, exactly 5:5 for Teil 2; Lesen Teil 3 has one or two x.
3. **Distractor overlap:** in Lesen Teil 1, at least three unused headings share a content word with a text; in Lesen Teil 2, every wrong option shares at least one content word with the article.
4. **Option balance:** the correct option is not the longest in more than two of five items.
5. **Gap variety:** Sprachbausteine Teil 1 has at least five distinct grammar areas (from the `grammarTopic` tags); Teil 2 has five unused words in same-class pairs.
6. **Judge (optional, only after 1–5 pass):** one short model call answers, without seeing the key, whether each item can be solved by keyword matching alone; items that can are regenerated once.
A rejection regenerates that Teil once and logs it, exactly like the originality check, so the learner is never blocked.
