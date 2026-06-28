# CEFR Multilevel — Reading & Writing Dynamic Generation Spec

> Build spec for Claude Code. Source of truth: the official **Multilevel Master Reading** book
> (Mirjonov & Qutimov, Factor Books 2023), the **Multilevel New Format Writing** compilation,
> and a real **Full Mock** paper from the State Testing Centre (DTM) of Uzbekistan.
>
> Goal: let users press **"Generate"** and receive a fresh, format-identical Reading or Writing
> practice set that an LLM also **grades**. Everything below is derived from those books so that
> generated items match the real exam's structure, CEFR levels, word counts, and answer formats.
>
> **Do not hardcode passages.** Every passage, advertisement, heading set, and prompt is generated
> at request time by the model using the schemas and prompt templates in this document.

---

## 0. The exam at a glance

This is the **Uzbekistan Multilevel** English exam (DTM / State Testing Centre). It assesses
**B1 → B2 → C1** in a single sitting. We generate two of its papers:

| Paper | Parts | Questions | Time | CEFR span |
|-------|-------|-----------|------|-----------|
| **Reading** | 5 | 35 (Q1–35) | 60 min | B1 (Part 1) → C1 (Part 5) |
| **Writing** | 2 sections, 3 tasks | — | ~60 min | B1 → B2 → C1 |

Each correct reading answer = 1 mark. Difficulty rises part by part: early parts are B1,
the final reading part and the final writing task are C1.

The two papers are independent generators. A "practice set" can be one full Reading paper,
one full Writing paper, a single part/task, or a randomized mix — the schemas are modular.

---

# PART A — READING GENERATION

The Reading paper has **5 parts, 35 questions total**, fixed question numbering:

| Part | Q# | Item type | Texts | CEFR | Key generation facts |
|------|-----|-----------|-------|------|----------------------|
| 1 | 1–6 | Gap fill — word from text | 1 article, 150–200 w | **B1** | 6 gaps; each answer is a single word that **appears elsewhere in the same text** |
| 2 | 7–14 | Match adverts to statements | 8 short themed adverts/notices | **B1–B2** | 10 statements A–J; **2 are extra**; each statement used once |
| 3 | 15–20 | Match headings to paragraphs | 1 text, 6 paragraphs | **B2** | Heading list longer than 6 (usually 8); no heading reused |
| 4 | 21–29 | MCQ + True/False/No Info | 1 long text | **B2–C1** | 9 Qs = **4 MCQ (A–D)** + **5 T/F/NI** |
| 5 | 30–35 | Summary gap fill + MCQ | 1 academic text, 500–650 w | **C1** | 6 Qs = **4 gap fill** (one word and/or a number, answers in text order) + **2 MCQ (A–D)** |

Always render the official instruction line for each part (given verbatim per part below).

---

## Part 1 — Gap fill (word taken from the text) · Q1–6 · B1

### Official rules (from the book)
- Text is built from a **newspaper / magazine / internet article**, ~**150–200 words**, **B1** level.
- **6 gaps** are placed through the text. Each gap takes **exactly ONE word**.
- **Critical rule:** the word that fills each gap **already exists somewhere else in the same text**.
  The test-taker must find it within the passage. So generation must guarantee every answer word
  appears at least once more in the running text (outside its own gap).
- Answers can be any part of speech (noun, verb, adjective, etc.). The surrounding grammar
  (number, tense, preposition that follows) must make exactly one word fit.

### Instruction line (render verbatim)
> *Read the text. Fill in each gap with ONE word. You must use a word which is somewhere in the rest of the text.*

### Generation requirements
1. Write a coherent 150–200 word B1 article on a single everyday/popular-science topic
   (travel, animals, technology, everyday history, health, etc.).
2. Choose 6 answer words such that **each chosen word occurs ≥ 2 times** in the text. Replace
   exactly ONE occurrence of each with a numbered gap `(1) ____ … (6) ____`. Leave the other
   occurrence(s) intact so the word is findable.
3. Gaps must be spread across the text, not clustered.
4. Distractor-proofing: ensure no *other* word in the text could grammatically and semantically
   fit the gap as well. Each gap has exactly one defensible answer.
5. Number gaps 1→6 in reading order.

### Output JSON
```json
{
  "part": 1,
  "cefr": "B1",
  "instruction": "Read the text. Fill in each gap with ONE word. You must use a word which is somewhere in the rest of the text.",
  "title": "Looking for a new Earth",
  "text_with_gaps": "For thousands of years... Currently, many (1) ______ are looking for new planets... when astronomers have found the (2) ______, they look at the planets around it...",
  "questions": [
    { "number": 1, "answer": "astronomers", "appears_elsewhere": true },
    { "number": 2, "answer": "star", "appears_elsewhere": true }
  ],
  "answer_key": { "1": "astronomers", "2": "star", "3": "planets", "4": "look", "5": "rocks", "6": "water" }
}
```
> `text_with_gaps` must contain the literal tokens `(1) ______` … `(6) ______`. The frontend
> splits on these to render input boxes.

### Grading (Part 1)
- Exact-match, **case-insensitive**, trim whitespace.
- Accept the answer word only (no extra words). Optionally accept obvious inflection if you
  decide to be lenient, but the exam expects the exact word present in the text, so **strict
  match to `answer` is the default**.

---

## Part 2 — Match adverts/notices to statements · Q7–14 · B1–B2

### Official rules (from the book — "PART 2 · E'LONLAR / Advertisements")
- The test gives **8 short advertisements / notices**, all on **one shared theme**
  (e.g. all language courses, all hotels, all swimming/sports notices, all day-courses).
- There are **10 statements**, labelled **A–J**.
- Each advert matches **exactly one** statement. **2 statements are extra** and match no advert.
- Each statement is used **once only**.
- Adverts are numbered **1–8** internally but map to questions **7–14**.

### Instruction line (render verbatim)
> *Read the texts and the statements A–J. Decide which text matches with the situation described in the statements. Each statement can be used ONCE only. There are TWO extra statements which you do not need to use.*

### Generation requirements
1. Pick one theme. Write **8 distinct short adverts** (1–4 lines each: a name/title + a couple
   of feature lines, optionally a price/phone/URL). Keep them realistic and varied.
2. Write **10 statements A–J**. Exactly 8 of them each paraphrase **one unique** advert's key
   selling point (the matching detail must be **inferable, not copied verbatim** — use synonyms,
   as the real exam does). 2 statements are **plausible-but-unmatched distractors** that fit the
   theme but contradict or are absent from all 8 adverts.
3. Ensure each advert has **one and only one** correct statement (no advert matches two; no
   statement matches two adverts).
4. Map adverts 1–8 → questions 7–14.

### Output JSON
```json
{
  "part": 2,
  "cefr": "B1-B2",
  "theme": "language courses abroad",
  "instruction": "Read the texts and the statements A–J. Decide which text matches with the situation described in the statements. Each statement can be used ONCE only. There are TWO extra statements which you do not need to use.",
  "statements": {
    "A": "You need to learn the language for your job.",
    "B": "You would like to continue your studies in another country.",
    "C": "You want to learn the language and do interesting things in your free time.",
    "...": "...",
    "J": "You want to meet people from local companies during the course."
  },
  "adverts": [
    { "number": 1, "question": 7,  "title": "Spanish Courses in Barcelona", "body": "General Spanish classes, all levels. One-or two-month courses. Free accommodation. Registration starts 1 July." },
    { "number": 8, "question": 14, "title": "Intensive Spanish Language Courses", "body": "Stay with carefully chosen families. Socialize with guests from the local business community..." }
  ],
  "answer_key": { "7": "G", "8": "C", "9": "...", "14": "J" },
  "extra_statements": ["D", "F"]
}
```

### Grading (Part 2)
- Each question's answer is a single letter A–J. Exact-match, uppercase-normalize.
- Provide brief rationale per item (which advert phrase maps to which statement) for feedback.

---

## Part 3 — Match headings to paragraphs · Q15–20 · B2

### Official rules (from the book)
- One text divided into **6 paragraphs** (labelled I–VI or Q1–Q6 / P1–P6).
- A **list of headings** is given that is **longer than the number of paragraphs** (the book
  uses **8 headings A–H** for 6 paragraphs). So there are **more headings than paragraphs** and
  some headings are **not used**.
- **No heading may be used more than once.**
- Paragraphs map to questions **15–20**.

### Instruction line (render verbatim)
> *Read the text and choose the correct heading for each paragraph from the list of headings below. There are more headings than paragraphs, so you will not use all of them. You cannot use any heading more than once.*

### Generation requirements
1. Write a **6-paragraph** informational/expository text (B2) on one subject (a country, a
   profession, a phenomenon). Each paragraph has a clear single main idea.
2. Produce **8 headings A–H**: 6 are correct (one per paragraph) and 2 are **close distractors**
   (mention something touched on in the text but not the paragraph's *main* idea — the classic
   trap).
3. Headings are short noun phrases (3–6 words), e.g. *"Holy water"*, *"Resisting the heat"*,
   *"City of contrasts"*.
4. Each paragraph's main idea must point to exactly one heading; no two paragraphs share a heading.
5. Map paragraphs → questions 15–20.

### Output JSON
```json
{
  "part": 3,
  "cefr": "B2",
  "instruction": "Read the text and choose the correct heading for each paragraph from the list of headings below. There are more headings than paragraphs, so you will not use all of them. You cannot use any heading more than once.",
  "headings": {
    "A": "An ancient place", "B": "Holy water", "C": "Famous industry",
    "D": "Ajanta in the modern day", "E": "Resisting the heat", "F": "Things about Mumbai",
    "G": "City of contrasts", "H": "Modern languages' ancestor"
  },
  "paragraphs": [
    { "number": 1, "question": 15, "text": "The world's first university was established in India..." },
    { "number": 6, "question": 20, "text": "There is an unusual treasure hidden in the Indian mountains..." }
  ],
  "answer_key": { "15": "H", "16": "G", "17": "B", "18": "E", "19": "C", "20": "A" },
  "unused_headings": ["D", "F"]
}
```

### Grading (Part 3)
- Single letter per question. Exact-match, uppercase-normalize.

---

## Part 4 — Long text: MCQ + True/False/No Information · Q21–29 · B2–C1

### Official rules (from the book)
- **One longer text** (narrative, biography, history, or feature article).
- **9 questions** in two blocks:
  - **Questions 21–24 (4):** multiple choice, **options A, B, C, D**.
  - **Questions 25–29 (5):** **True / False / No Information** statements, options **A) True · B) False · C) No Information**.
- "No Information" = the statement is neither confirmed nor contradicted by the text (must be
  genuinely absent, not just false).

### Instruction lines (render verbatim)
> *For questions 21–24, choose the correct answer A, B, C, or D.*
>
> *For questions 25–29, decide if the following statements agree with the information given in the text. Mark your answers on the answer sheet.* (A) True (B) False (C) No Information

### Generation requirements
1. Write one **~400–550 word** B2–C1 text with enough factual detail to support 9 questions.
2. **4 MCQ** (Q21–24): each a stem + 4 options; one correct, three plausible distractors grounded
   in the text. Mix question focuses: detail, inference, vocabulary-in-context, author's point,
   "which is NOT mentioned".
3. **5 T/F/NI** (Q25–29): produce a balanced spread — at least one of each of True, False, and
   No Information across the five. For each, store *which* sentence(s) justify True/False, or note
   "absent" for No Information.
4. Keep questions in text order where natural; the answer evidence should be locatable.

### Output JSON
```json
{
  "part": 4,
  "cefr": "B2-C1",
  "title": "Pirates",
  "text": "There have always been people who robbed ships in the open sea...",
  "instruction_mcq": "For questions 21–24, choose the correct answer A, B, C, or D.",
  "instruction_tfn": "For questions 25–29, decide if the following statements agree with the information given in the text.",
  "mcq": [
    {
      "number": 21,
      "stem": "The 'Golden Age' of piracy lasted ...",
      "options": { "A": "for a century", "B": "for 70 years", "C": "until the XIX century", "D": "until James Kidd died" },
      "answer": "B",
      "evidence": "Thousands of pirates were active from 1650–1720."
    }
  ],
  "tfn": [
    {
      "number": 25,
      "statement": "The flag 'Jolly Roger' meant death for ships' sailors and passengers.",
      "answer": "B",
      "evidence": "A red flag told other ships there would be no pity and no prisoners — it was about the attacking ship's intent, not passenger death."
    },
    {
      "number": 29,
      "statement": "Francis Drake was the richest English pirate.",
      "answer": "C",
      "evidence": "Text says he brought lots of treasure but never ranks him as richest → No Information."
    }
  ],
  "answer_key": { "21": "B", "22": "C", "23": "B", "24": "C", "25": "B", "26": "C", "27": "B", "28": "A", "29": "C" }
}
```

### Grading (Part 4)
- Single letter A–D (MCQ) or A/B/C (T/F/NI). Exact-match, uppercase-normalize.
- Surface `evidence` in feedback so users learn *why*.

---

## Part 5 — Academic text: summary gap fill + MCQ · Q30–35 · C1

### Official rules (from the book — "PART 5")
- **One academic / abstract C1 text**, **500–650 words** (the hardest part).
- **6 questions** in two blocks:
  - **Questions 30–33 (4):** **gap fill / summary completion**. Each blank takes
    **no more than ONE word and/or a number** (e.g. `25 students` is valid — a word + number
    combo is allowed, not only one or the other). The four answers appear **in the same order
    as the information in the text** (sequential). The answer word/number must be drawn from the
    passage and must fit the blank **grammatically and in meaning**.
  - **Questions 34–35 (2):** multiple choice, **options A, B, C, D**.

### Instruction lines (render verbatim)
> *For questions 30–33, fill in the missing information in the numbered spaces. Write no more than ONE WORD and / or A NUMBER for each question.*
>
> *For questions 34–35, choose the correct answer A, B, C, or D.*

### Generation requirements
1. Write a **500–650 word C1 expository/argumentative text** on an abstract or academic topic
   (science, society, history of ideas, economics, psychology). Dense, formal register.
2. **4 summary-completion items** (Q30–33): write short sentences that paraphrase the text with a
   blank. The answer is a word and/or number **lifted from the passage**, fitting the blank's
   grammar. Ensure the 4 answers occur **in text order**.
3. **2 MCQ** (Q34–35): stem + 4 options (A–D), targeting main idea / inference / detail.
4. For each gap, store the exact accepted answer(s) and the source sentence.

### Output JSON
```json
{
  "part": 5,
  "cefr": "C1",
  "title": "Is graffiti art or crime?",
  "text": "The term graffiti derives from the Italian graffito meaning 'scratching'...",
  "instruction_gap": "For questions 30–33, fill in the missing information in the numbered spaces. Write no more than ONE WORD and / or A NUMBER for each question.",
  "instruction_mcq": "For questions 34–35, choose the correct answer A, B, C, or D.",
  "gaps": [
    { "number": 30, "sentence": "Ancient graffiti is of significance and records the ______ history of life for that period.", "answer": "social", "accept": ["social"], "evidence": "...providing a social history of life and events at that time." },
    { "number": 31, "sentence": "The police can recognize incidents by the signature which is called ______.", "answer": "tag",  "accept": ["tag", "tags"], "evidence": "...stylised signatures or nicknames, known as 'tags'." },
    { "number": 32, "sentence": "Operatives ought to put on the suitable protective ______.", "answer": "equipment", "accept": ["equipment"] },
    { "number": 33, "sentence": "Removal from a new coating surface is convenient using ______.", "answer": "water", "accept": ["water"] }
  ],
  "mcq": [
    { "number": 34, "stem": "Which statement is true concerning the removal of graffiti?",
      "options": { "A": "Cocktail removal is safer than water.", "B": "A small patch trial should precede large-scale removal.", "C": "Chemical treatments are the most expensive.", "D": "Mechanical removal is more applicable than chemical." },
      "answer": "B" }
  ],
  "answer_key": { "30": "social", "31": "tag", "32": "equipment", "33": "water", "34": "B", "35": "C" }
}
```

### Grading (Part 5)
- Gap fill: case-insensitive exact match against `accept[]`. Allow the documented singular/plural
  or word+number forms you list in `accept`. Reject answers longer than "one word and/or a number".
- MCQ: single letter A–D.

---

## Reading — master generation prompt (LLM)

Use one system prompt per part, or this umbrella prompt with the part injected. Temperature
~0.8 for variety; validate output against the schema before saving.

```
SYSTEM:
You are an item writer for the Uzbekistan Multilevel (DTM) English Reading exam. You produce
ONE Reading {PART_NUMBER} item that is structurally identical to the official format and at the
correct CEFR level. Follow these non-negotiable rules:

{PASTE THE "Official rules" + "Generation requirements" + "Output JSON" BLOCK FOR THE PART}

Hard constraints:
- Original content only. Do NOT reproduce any copyrighted passage; invent fresh text.
- Respect the exact question numbering for this part: {Q_RANGE}.
- Respect the word count and CEFR level for this part.
- Every answer must be verifiable from your own generated text. Include evidence fields.
- Return ONLY valid JSON matching the schema. No prose, no markdown fences.

Self-check before returning:
- Part 1: each answer word appears elsewhere in the text; exactly 6 gaps.
- Part 2: 8 adverts, 10 statements, exactly 2 unused, one-to-one matching, paraphrase (not copy).
- Part 3: 6 paragraphs, 8 headings, 2 unused, no heading repeated.
- Part 4: 4 MCQ (A–D) + 5 T/F/NI; T/F/NI set contains at least one of each label.
- Part 5: 500–650 words; 4 gaps (≤ one word and/or a number, in text order) + 2 MCQ (A–D).

USER:
Generate a Reading Part {PART_NUMBER} item. Topic hint (optional): {TOPIC_OR_RANDOM}.
Avoid these recently used topics: {RECENT_TOPICS}.
```

### Validation layer (run in code after generation)
- Schema-validate the JSON.
- **Part 1:** assert each `answer` token (lowercased) appears ≥ 2× in `text_with_gaps` once the
  gap token is expanded mentally — i.e. appears ≥ 1× outside its gap. Assert exactly 6 gaps.
- **Part 2:** assert 8 adverts, 10 statements, answer_key has 8 unique letters, 2 letters unused.
- **Part 3:** assert 6 paragraphs, 8 headings, 6 unique answers, 2 unused.
- **Part 4:** assert 4 MCQ + 5 TFN; assert TFN labels include ≥1 each of A/B/C.
- **Part 5:** assert word count 500–650; 4 gaps + 2 MCQ; gap answers each ≤ "one word + optional number".
- On failure → regenerate (max 2 retries) before surfacing to the user.

---

# PART B — WRITING GENERATION

The Writing paper has **two sections** containing **three tasks** of rising CEFR level. Each task
is a **prompt the user writes a response to**; the model both **generates the prompt** and later
**grades the user's answer**.

| Task | Format | Audience / register | Words | CEFR |
|------|--------|---------------------|-------|------|
| **1.1** | Informal email/letter | A friend (you know them) | ~**50** | **B1** |
| **1.2** | Formal email/letter | A manager / stranger | **120–150** | **B2** |
| **2** | Forum post / blog / opinion article | Public audience | **180–200** | **C1** |

> In the new format, **Task 1.1 and 1.2 share ONE situation** (Section 1): the same scenario is
> addressed once informally to a friend and once formally to a manager. Task 2 (Section 2) is a
> separate opinion prompt. Generation can therefore produce a **linked pair** for Section 1 plus
> an **independent** Task 2.

---

## Task 1.1 — Informal email to a friend · ~50 words · B1

### What the prompt looks like (from the book's 30 examples)
A one-situation prompt about **club / gym / community life**, always asking for **(a) how you
felt** and **(b) what should be done / a suggestion**. Recurring scenarios: an argument with a
member, a disappointing event, an injury, a disagreement with a club decision, broken facilities,
a timetable change, a new rule, a noisy member, feeling left out, a cancelled trip, fee increases,
poor communication, an offensive comment, lack of diversity events, too much competition, a dull
guest speaker, long tiring sessions, poor cleanliness, app/website problems, unwelcoming to new
members, unfair competition results, bad lighting/ventilation, no dietary options, etc.

### Prompt template (generate)
> *Write a letter to your friend about {SITUATION}. Write about your feelings and what you think
> should be done to {GOAL}. Write about 50 words.*

### Model answer template (for grading reference + "show ideal answer")
```
Hey [Friend],
[1 sentence: what happened] [1 sentence: how it made you feel].
I think [the club/they] should [suggestion] to [benefit].
[Informal sign-off],
[Name]
```
Opening phrases to vary: *Hi …, Hey …, Hope you're doing well!, It's been a while!*
Closings to vary: *Take care, Talk soon, Catch you later, See you soon, Let me know what you think.*

### Output JSON (prompt)
```json
{
  "task": "1.1",
  "cefr": "B1",
  "register": "informal",
  "target_words": 50,
  "word_range": [45, 60],
  "situation": "a recent argument with another club member",
  "prompt": "Write a letter to your friend about a recent argument you had with another club member. Write about your feelings and what you think should be done to avoid such problems in the future. Write about 50 words.",
  "required_content_points": ["describe the situation", "describe your feelings", "suggest what should be done"],
  "model_answer": "Hey Sam, I had a heated argument with Josh about equipment use yesterday. Honestly, it left me upset. I think the club should set clearer rules and improve communication to prevent such misunderstandings."
}
```

---

## Task 1.2 — Formal email to a manager · 120–150 words · B2

### What the prompt looks like
A complaint/suggestion **letter to the club/gym manager** about a facility or service problem,
always asking for **(a) feelings** and **(b) what management should do**. Recurring scenarios:
poor hygiene in changing rooms, loud music, no air conditioning, cancelled class, rude staff,
broken machines, overcrowded pool, poor parking lighting, no vegetarian options, sudden fee rise,
unsafe weights area, no lockers, poor towels/soap, club opening late, few personal trainers, weak
Wi-Fi, renovation noise, dirty class rooms, disrespect to elderly/junior members, no family
discounts, unfriendly reception, schedule changes, unannounced closure, outdated music, no
mirrors, poor ventilation, sauna closed, no evening classes, rules not enforced, etc.

### Prompt template (generate)
> *Write a letter to the manager about {PROBLEM}. Write about your feelings and what you think
> the club management should do about the situation. Write about 120–150 words.*

### Structure the model expects (for grading + ideal answer)
1. **Opening:** *Dear Manager,* + *I am writing to express my concern about …*
2. **Body 1 — problem + detail:** what is wrong, with a concrete example.
3. **Body 2 — feelings + impact:** how it affects you/other members.
4. **Suggestion:** *I strongly urge / kindly suggest the management should …*
5. **Close:** *I hope this issue will be addressed… Sincerely, [Name]*

Useful openers: *I am writing to express my concern about… / I would like to bring to your
attention… / I am writing to raise a concern regarding…*
Useful closers: *I look forward to your response. / Thank you for your attention to this matter.*

### Output JSON (prompt)
```json
{
  "task": "1.2",
  "cefr": "B2",
  "register": "formal",
  "target_words": 135,
  "word_range": [120, 150],
  "problem": "the poor hygiene in the club's changing rooms",
  "prompt": "Write a letter to the manager about the poor hygiene in the club's changing rooms. Write about your feelings and what you think the club management should do about the situation. Write about 120–150 words.",
  "required_content_points": ["state the problem clearly", "give detail/example", "describe feelings & impact", "make a concrete suggestion", "formal opening and closing"],
  "model_answer": "Dear Manager, I am writing to express my concern about the poor hygiene in the club's changing rooms..."
}
```

> **Linked Section 1:** to mirror the new format, generate ONE situation and express it as both
> Task 1.1 (to a friend) and Task 1.2 (to the manager). Store a shared `situation_id`.

---

## Task 2 — Forum post / opinion article · 180–200 words · C1

### What the prompt looks like
A **discussion/forum question** on a contemporary issue, with the framing
*"You are taking part in a … forum. The question is: '…?' Post your response, giving reasons and
examples. Write 180–200 words."* Recurring themes: exams vs continuous assessment, solo vs group
travel, banning fast-food ads for kids, online vs classroom learning, climate-change
responsibility, learning other cultures, social media harm, robots & jobs, surveillance cameras,
living alone vs with family, kids & smartphones, modern vs classical art, studying abroad cost,
censoring lyrics, waking up early, tech & loneliness, compulsory school sports, big company vs own
business, equal pay, second languages, work from home vs office, public transport vs roads, online
vs physical shops, teen part-time jobs, electric cars, teen curfews, AI tools in learning,
mandatory vaccination, multitasking, rural vs city spending.

### Prompt template (generate)
> *You are {FORUM_CONTEXT}. The question is: "{QUESTION}?" Post your response, giving reasons and
> examples. Write 180–200 words.*

### Structure the model expects (C1, for grading + ideal answer)
1. **Intro (2–3 sentences):** state position; acknowledge the opposing view.
   *In my opinion… / While some argue …, I believe …*
2. **Body 1:** main argument + concrete example.
3. **Body 2:** second argument / the other side, with example.
4. **Balanced view / concession:** *However, it is important to consider…*
5. **Conclusion (1–2 sentences):** restate position. *In conclusion / To conclude…*

### Output JSON (prompt)
```json
{
  "task": "2",
  "cefr": "C1",
  "register": "neutral-to-formal",
  "target_words": 190,
  "word_range": [180, 200],
  "forum_context": "taking part in a student forum",
  "question": "Should exams be replaced with continuous assessment?",
  "prompt": "You are taking part in a student forum. The question is: \"Should exams be replaced with continuous assessment?\" Post your response, giving reasons and examples. Write 180–200 words.",
  "required_content_points": ["clear position", "≥2 reasons with examples", "acknowledge counter-view", "balanced conclusion"],
  "model_answer": "In my opinion, continuous assessment is a more effective way to evaluate students..."
}
```

---

## Writing — master generation prompt (LLM)

```
SYSTEM:
You are an item writer for the Uzbekistan Multilevel (DTM) English Writing exam. Generate ONE
writing PROMPT (not an essay) for Task {TASK_ID}, matching the official format and CEFR level.

{PASTE the prompt template + Output JSON schema for the task}

Rules:
- Task 1.1 = informal, ~50 words, B1, to a friend, club/community life situation.
- Task 1.2 = formal, 120–150 words, B2, to a manager, club/facility problem.
- Task 2 = forum/opinion, 180–200 words, C1, contemporary debate question.
- Always require BOTH feelings AND a suggestion for Tasks 1.1/1.2.
- Provide a `model_answer` at the target level for grading reference.
- Return ONLY valid JSON. No fences.

USER:
Generate a Task {TASK_ID} prompt. Theme hint (optional): {THEME_OR_RANDOM}.
Avoid recently used situations: {RECENT}.
{If linked Section 1: "Use this shared situation for both 1.1 and 1.2: {SITUATION}."}
```

---

# PART C — GRADING (LLM rubric grader for Writing)

Reading grading is deterministic (key comparison — see each part). Writing grading uses an LLM
rubric aligned to CEFR. Return a structured score + actionable feedback.

### Rubric dimensions (score each 0–5, weight per task)
| Dimension | What it measures |
|-----------|------------------|
| **Task achievement** | Did they cover all required content points? Right format/register? Word count in range? |
| **Coherence & cohesion** | Logical flow, paragraphing, linking devices |
| **Lexical resource** | Range/accuracy of vocabulary for the level |
| **Grammatical range & accuracy** | Sentence variety, error density |
| **Register & tone** | Informal (1.1) / formal (1.2) / forum-appropriate (2) |

### Level mapping
- Task 1.1 graded **against B1**, Task 1.2 against **B2**, Task 2 against **C1**.
- Convert the average to an estimated CEFR band for that task and an overall writing estimate.

### Grader prompt
```
SYSTEM:
You are a calibrated CEFR examiner for the Uzbekistan Multilevel Writing exam. Grade the user's
response to the given task. The expected level is {CEFR}. Be fair but strict on register and
task achievement. Penalise: wrong register, missing required content points, out-of-range word
count, off-topic content. Reward: level-appropriate vocabulary, accurate grammar, clear structure.

You are given: the task prompt, required_content_points, target word range, expected CEFR, and the
user's answer.

Return ONLY JSON:
{
  "word_count": <int>,
  "in_range": <bool>,
  "scores": { "task_achievement": 0-5, "coherence": 0-5, "lexical": 0-5, "grammar": 0-5, "register": 0-5 },
  "overall_0_100": <int>,
  "estimated_cefr": "B1|B2|C1|...",
  "met_content_points": ["..."],
  "missed_content_points": ["..."],
  "strengths": ["short bullet", "..."],
  "improvements": ["short, specific, actionable", "..."],
  "corrected_sentences": [ { "original": "...", "improved": "..." } ],
  "examiner_comment": "2–3 sentence summary"
}

USER:
TASK PROMPT: {prompt}
REQUIRED CONTENT POINTS: {required_content_points}
TARGET WORDS: {word_range}  EXPECTED CEFR: {cefr}
USER ANSWER: """{user_answer}"""
```

### Grading guards (in code)
- Compute `word_count` server-side too; don't trust the model's count blindly.
- If answer is empty / off-topic / not in the target language → return a clear "not gradable" state.
- Cap `corrected_sentences` (e.g. 5) to keep feedback focused.
- Store the rubric scores so you can show progress over time.

---

# PART D — Data model & API shape (suggested)

```
generation_request {
  paper: "reading" | "writing",
  scope: "full" | "part" | "task",
  part?: 1..5,            // reading
  task?: "1.1"|"1.2"|"2", // writing
  topic_hint?: string,
  exclude_recent?: string[]
}

reading_item   -> the per-part JSON schemas above (includes answer_key + evidence)
writing_prompt -> the per-task JSON schemas above (includes model_answer + required_content_points)

grade_request {
  paper: "reading" | "writing",
  item_id,
  // reading:
  user_answers?: { "1": "...", "7": "G", ... },
  // writing:
  task_id?, user_answer?: string
}

grade_response {
  // reading: per-question correct/incorrect + correct answer + evidence + score X/Y
  // writing: rubric JSON above
}
```

### Anti-repetition / freshness
- Keep a per-user (or global) rolling list of recent **topics/situations**; pass as
  `exclude_recent` so generations stay fresh.
- Cache validated items; regenerate on schema/validation failure (max 2 retries).
- Seed `topic_hint` from a curated theme pool per part/task (the recurring themes listed above are
  good seeds) to keep variety realistic and exam-like.

---

# PART E — Quick reference cheat-sheet

**Reading (35 Q / 60 min)**
- P1 Q1–6 · B1 · 150–200 w article · 6 gaps · *answer word is elsewhere in text*
- P2 Q7–14 · 8 themed adverts · 10 statements A–J · 2 extra · one-to-one match
- P3 Q15–20 · 6 paragraphs · 8 headings A–H · 2 unused · no reuse
- P4 Q21–29 · long text · 4 MCQ (A–D) + 5 True/False/No Information
- P5 Q30–35 · C1 · 500–650 w · 4 summary gaps (≤1 word and/or a number, in text order) + 2 MCQ (A–D)

**Writing (3 tasks)**
- T1.1 · B1 · ~50 w · informal email to a friend · feelings + suggestion
- T1.2 · B2 · 120–150 w · formal email to a manager · feelings + suggestion
- T2 · C1 · 180–200 w · forum/opinion post · position + reasons + examples + balanced conclusion

**Always render the official instruction line for each part/task (verbatim text supplied above).**
