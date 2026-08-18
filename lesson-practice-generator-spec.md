# Lesson + Practice Generator — Full Specification

A topic-agnostic blueprint. The generator never invents structure; it fills this spec.

---

## PART 1 — Explanation page structure

Twelve fixed blocks. `R` = required for every topic, `O` = include only if the topic has content for it. Keep your existing numbered visual style (`01`, `02`, …) — only the block list changes.

| # | Block | Req | What goes in it |
|---|-------|-----|-----------------|
| 00 | **Meta bar** | R | CEFR level, IELTS skills affected, time estimate, prerequisites. Not shown as a section — it's the header chip row. |
| 01 | **Objective** | R | One measurable sentence: "By the end… you will be able to…" |
| 02 | **See it first** | R | 60–90 words of natural text or a short dialogue in an IELTS-relevant context (work, study, hometown, hobbies), target forms bolded. End with one noticing question: *"Why is one verb `drink` and the other `am drinking`?"* — do **not** answer it yet. |
| 03 | **The core idea** | R | **New.** One memorable sentence a teacher can write on the board. *"Present Simple = always true. Present Continuous = true around now."* This is the single most useful block for teachers and it's currently missing. |
| 04 | **How it's built** | R | Form table (+ / − / ? / short answer) **plus** three sub-blocks: spelling rules (`-s/-es/-ies`, `-ing` doubling, `make→making`, `lie→lying`), contractions, and pronunciation (`/s/ /z/ /ɪz/`). |
| 05 | **When we use it** | R | One card per use: use name → plain rule → 2–3 examples → timeline graphic. **Render the timeline as SVG, not an ASCII code block** — the monospace block reads as raw code on a projector. |
| 06 | **Signal words** | R | Two-column table: marker → which form. (*every day, usually, rarely, on Mondays* / *now, at the moment, currently, today, this week, these days, Look!, Listen!*) Teachers reach for this more than any other block. |
| 07 | **Watch out** | O | Genuine exceptions, which are rules — not errors. For this topic: **stative verbs** (`know, like, want, believe, belong`) and the `have` split. Its absence is the biggest content hole in the current version. |
| 08 | **Both are correct** | O | **New.** Minimal pairs where both forms are grammatical but the meaning shifts: *I live in Tashkent* / *I'm living in Tashkent*; *I have lunch at 1* / *I'm having lunch*. This is where B1 becomes B2. |
| 09 | **Mistakes to avoid** | R | Wrong / Right / Why table. Every row carries a `misconception_id` that practice items and reports reuse. L1 notes are **retrieved from a verified table**, never improvised — the current text claims Uzbek has no continuous tense, but Uzbek has the `-yap-` progressive (*o'qiyapti*). |
| 10 | **In the exam** | R | Split by skill, not one generic paragraph: Speaking Part 1/2/3, Writing Task 1 (trends: *prices are rising*), Task 2, Listening/Reading traps. Band 6 vs Band 7 pair **plus one full model answer** to a real question stem. |
| 11 | **Quick check** | R | 3 concept-checking questions with tap-to-reveal answers. Bridges explanation → practice; doubles as the teacher's board work. |
| 12 | **Cheat sheet** | R | Printable/saveable summary card: core idea + form table + signal words + top 3 errors, on one page. |

### Teacher layer (toggle, same page)

Rendered only when `mode=teacher`:

- **Lesson plan** with timings (present 8 min → controlled 12 min → freer 15 min)
- **CCQs** per use, with expected student answers
- **Board plan** — what to write, in what order
- **Anticipated problems** and how to respond
- **Extension activity** for fast finishers, **homework** suggestion
- **Presentation mode** — staged reveal for a projector, one block per screen
- **Answer key** with rationale, printable

---

## PART 2 — Practice structure (default 20 items)

Six tiers, fixed proportions. The generator picks item types from the library but cannot change the counts without an explicit override.

| Tier | Items | Purpose | Types allowed |
|------|-------|---------|---------------|
| **Notice it** | 2 | Recognition before production | classify/sort (habit vs now), tap-the-verb, true/false about a sentence's meaning |
| **Warm up** | 6 | Controlled, cued, single sentence | gap-fill with verb cue, MCQ (3–4 options), match halves |
| **Now change it** | 5 | Manipulation | make negative, make question, error correction, rewrite with a given signal word, transform simple ↔ continuous |
| **Put it together** | 3 | Discourse level | connected-text gap-fill (one paragraph, 5 gaps = 1 item), dialogue completion, word-order/drag |
| **Say it** | 1 | Pronunciation / fluency | read-aloud with `-s` ending check, or record a 20-second Part 1 answer. Skippable if no mic. |
| **Write it** | 3 | Free production, AI-marked | escalating: 1 sentence → 3 sentences → full IELTS Part 1 answer (40–60 words) |
| | **20** | | |

Presets: `quick` = 10 (2/4/2/1/0/1), `standard` = 20, `full` = 32, `exam` = 20 timed.

### Coverage constraints (hard gates — regenerate the set if unmet)

- Every `use` in the topic spec → **≥ 2** items
- Every `misconception` → **≥ 1** item
- Every form (+ / − / ?) → **≥ 1** item
- Every listed exception (e.g. stative verbs) → **≥ 1** item
- No verb lemma used more than **twice** across the set
- Difficulty curve: tier 1–2 mostly difficulty 1, tier 3–4 mostly 2, tier 5–6 mostly 3

### Distractor rule

Every MCQ distractor is generated **from a named misconception**, never as filler. In the current set, `I works on a new project` tests subject–verb agreement — off-target and implausible. Replace with distractors that map to real errors:

- `I working…` → `drop_aux_be`
- `I work on a new project at the moment.` → `simple_for_now`
- `I am working every day.` → `continuous_for_habit`

This is what makes the results report say *"you drop the auxiliary be"* instead of *"8/20"*.

### Answer acceptance

- Normalise: trim, collapse whitespace, case-insensitive, straight/curly apostrophes equal
- Accept contractions both ways (`I am taking` / `I'm taking` / `I´m taking`)
- Levenshtein distance 1 on a content word → mark correct with a "check your spelling" nudge, not a fail
- Multiple valid keys where the context genuinely allows both

### Free-writing marking

Rubric with three criteria, each 0–3, shown to the student **before** they write:

1. **Target form accuracy** — did they use the taught structure correctly?
2. **Task completion** — did they do what was asked?
3. **Range and naturalness** — vocabulary, linkers, does it sound like a person?

Output: inline highlights on the errors, one strength, one fix, and a model answer written one band above the learner's current level.

### After submission

- Per-item explanation on reveal, **linked back to the explanation block** (`see 05 · When we use it`)
- Misconception heat map for the student, and class-level for the teacher
- Any misconception failed ≥ 2 times → auto-generate a 5-item **booster set**
- Spaced review: 3 of the missed items resurface at day 3 and day 10

### Timer

Off by default in practice mode. On only in `exam` preset. A visible clock on a learning task adds anxiety without measuring anything useful.

---

## PART 3 — Data schemas

### `topic_spec.json` — authored/generated once per topic, reviewed by a human

```json
{
  "topic_id": "present_simple_vs_present_continuous",
  "title": "Present Simple vs. Present Continuous: Routines and Right Now",
  "cefr": "A2-B1",
  "skill_focus": ["speaking", "writing"],
  "prerequisites": ["present_simple_basic", "verb_be"],
  "core_idea": "Present Simple = always true. Present Continuous = true around now.",
  "forms": [
    { "form": "affirmative", "simple": "I work. / He works.", "continuous": "I'm working. / He's working." },
    { "form": "negative",    "simple": "I don't work. / He doesn't work.", "continuous": "I'm not working. / He isn't working." },
    { "form": "question",    "simple": "Do you work? / Does he work?", "continuous": "Are you working? / Is he working?" }
  ],
  "spelling_rules": [
    { "rule": "third_person_s", "detail": "study → studies, watch → watches, go → goes" },
    { "rule": "ing_doubling",   "detail": "run → running (short stressed CVC)" },
    { "rule": "ing_drop_e",     "detail": "make → making; lie → lying" }
  ],
  "pronunciation": [{ "pattern": "-s endings", "detail": "/s/ works · /z/ runs · /ɪz/ watches" }],
  "uses": [
    { "id": "habit",     "label": "Habits and routines", "rule": "Things you do regularly.", "examples": ["I go to the gym on Mondays."] },
    { "id": "permanent", "label": "Permanent states",    "rule": "Things that stay true.",   "examples": ["I live in Tashkent."] },
    { "id": "right_now", "label": "Happening now",       "rule": "At this moment.",          "examples": ["I'm writing a report."] },
    { "id": "temporary", "label": "Temporary period",    "rule": "True around now, not forever.", "examples": ["She's staying at a hotel this week."] },
    { "id": "trend",     "label": "Changing trends",     "rule": "Developing situations.",   "examples": ["Prices are rising."], "cefr": "B1+" }
  ],
  "signal_words": [
    { "marker": "every day", "form": "simple" },
    { "marker": "at the moment", "form": "continuous" }
  ],
  "exceptions": [
    { "id": "stative", "rule": "State verbs are not normally used in continuous.",
      "members": ["know", "like", "want", "believe", "belong", "understand"],
      "examples": ["I know the answer. NOT I am knowing."] }
  ],
  "contrast_pairs": [
    { "a": "I live in Tashkent.", "b": "I'm living in Tashkent.",
      "difference": "(a) is permanent; (b) suggests it's temporary." }
  ],
  "misconceptions": [
    { "id": "drop_aux_be",         "wrong": "I working today.",   "right": "I am working today.", "why": "Continuous always needs be." },
    { "id": "simple_for_now",      "wrong": "Look! It rains.",    "right": "Look! It is raining.", "why": "Actions at the moment of speaking take continuous." },
    { "id": "continuous_for_habit","wrong": "I am going to the gym every Monday.", "right": "I go to the gym every Monday.", "why": "Regular habits take simple." },
    { "id": "stative_in_continuous","wrong": "I am knowing him.", "right": "I know him.", "why": "State verbs stay simple." },
    { "id": "third_person_s",      "wrong": "She work here.",     "right": "She works here.", "why": "Add -s for he/she/it." }
  ],
  "l1_notes": [
    { "l1": "ru", "note": "Russian has no auxiliary in the present, so 'be' is often dropped.", "verified": true },
    { "l1": "uz", "note": "Uzbek marks the progressive with the -yap- suffix (o'qiyapti), so learners tend to omit the separate auxiliary 'be' rather than the aspect itself.", "verified": true }
  ],
  "exam": {
    "speaking_p1": { "why": "Grammatical Range and Accuracy — contrasting habits with current activities.",
                     "band6": "Usually I am studying at home, but today I study in the library.",
                     "band7": "Usually I study at home, but today I'm studying in the library.",
                     "model_question": "What do you usually do in the evenings?",
                     "model_answer": "..." },
    "writing_t1": { "why": "Trends use the continuous: 'the number of visitors is rising steadily'." }
  },
  "ccqs": [
    { "q": "I'm staying with my cousin. Is this forever?", "a": "No — temporary." },
    { "q": "She works at a bank. Is she working right now?", "a": "Not necessarily — it's her job in general." }
  ],
  "cheat_sheet": ["Core idea", "Form table", "Signal words", "Top 3 errors"]
}
```

### `practice_item.json`

```json
{
  "id": "p07",
  "tier": "transform",
  "type": "error_correction",
  "instruction": "Find and fix the mistake.",
  "stem": "Look! It rains outside.",
  "answer_key": ["Look! It is raining outside."],
  "accepted_variants": ["Look! It's raining outside."],
  "options": null,
  "tags": { "use": "right_now", "form": "affirmative", "misconception": "simple_for_now" },
  "difficulty": 2,
  "feedback": {
    "correct": "Yes — 'Look!' signals this moment, so we need the continuous.",
    "incorrect": "'Look!' means it's happening now. Use be + verb-ing.",
    "by_option": null
  },
  "explanation_ref": "uses.right_now",
  "personalisable_slots": ["subject", "place"]
}
```

---

## PART 4 — Validation pipeline

Run before an item is ever shown. This is what keeps quality stable across a hundred topics.

1. **Uniqueness / ambiguity check.** Second model call acts as an *adversarial solver*: "Give a different answer than the key and justify it." If it succeeds, the item is ambiguous — regenerate. This catches the classic `I ___ (work) here` where both tenses are valid without a time marker.
2. **Key validity.** Solve the item independently, no key shown. If the independent solve disagrees with the key, discard.
3. **Level check.** All vocabulary within the topic's CEFR band + 1. Flag anything above.
4. **Coverage check.** Assert the hard gates in Part 2. Fail → regenerate only the missing slots, not the whole set.
5. **Distractor check.** Each distractor maps to a declared `misconception_id` and is grammatically plausible.
6. **Repetition check.** No verb lemma > 2×, no stem template > 3×.
7. **Context check.** Each gap has at least one forcing signal (time marker, `Look!`, `every`, discourse) so the tense is determined.
8. **Safety/neutrality.** No names, places, or scenarios that would land badly for the learner's region.

Log every failure with its reason. The failure log is the fastest way to improve the generation prompt.

---

## PART 5 — Prompt for Claude Code (build the system)

Paste this as the opening instruction in Claude Code.

```
You are building the lesson + practice generator for an AI English/IELTS platform.
The generator must be topic-agnostic: grammar, vocabulary, collocations, and exam
skills all flow through the same pipeline. It never invents page structure — it
fills a fixed spec.

Read `lesson-practice-generator-spec.md` in the repo root first. It defines the
explanation blocks, the practice blueprint, the JSON schemas, and the validation
gates. Treat it as authoritative.

Build these modules:

1. `topics/` — one `topic_spec.json` per topic, conforming to the schema in
   Part 3. Write a JSON Schema file and validate on load. Ship
   `present_simple_vs_present_continuous.json` fully populated as the reference,
   including stative verbs, signal words, contrast pairs, and all five
   misconceptions.

2. `l1_notes.json` — a hand-verified table of L1 interference notes keyed by
   language code. The generator RETRIEVES from this table; it must never write
   an L1 claim itself. Seed it with ru, uz, kk, tg, tr, ar, and mark each entry
   `verified: true/false`. Unverified entries are not rendered.

3. `generator/explanation.ts` — takes a topic_spec + mode (student|teacher) and
   returns the ordered blocks 01–12 from Part 1. Blocks marked optional are
   omitted when the spec has no content for them. Timelines render as inline SVG,
   never as monospace ASCII.

4. `generator/practice.ts` — takes a topic_spec + preset (quick|standard|full|exam)
   and returns a practice set. Default preset is `standard` = 20 items with the
   tier distribution 2/6/5/3/1/3. Assemble by filling blueprint slots: for each
   slot, call the model with the slot's tier, type, target use tag, target
   misconception tag, and difficulty — never ask for "20 questions" in one call.
   Generate slots in parallel batches, then run the validator.

5. `generator/validate.ts` — implements all eight gates in Part 4, including the
   adversarial-solver ambiguity check. Returns per-item pass/fail plus a reason
   code. Failed slots regenerate individually, max 3 attempts, then drop the slot
   and refill from a different type in the same tier. Persist a failure log.

6. `marking/` — deterministic marking for closed items with the normalisation
   rules in Part 2 (case, whitespace, apostrophe variants, contractions,
   Levenshtein-1 spelling nudge). Rubric-based AI marking for free-writing items:
   three criteria scored 0–3, inline error highlights, one strength, one fix, and
   a model answer one band above the learner.

7. `reporting/` — roll results up to misconception_id, not just a raw score.
   Student view: which misconceptions fired. Teacher view: class heat map. If a
   misconception fails ≥2 times, generate a 5-item booster set for that tag only.
   Schedule missed items for spaced review at day 3 and day 10.

8. `ui/` — keep the existing look: Explanation | Practice tabs, numbered sections,
   right-hand navigator grouped by tier with per-tier counts, Flag, Finish & submit.
   Add: teacher toggle, presentation mode (one block per screen, staged reveal),
   printable worksheet + answer key export, per-item explanation on reveal that
   deep-links to its explanation block. Timer off by default; on only in `exam`.

Constraints:
- Every generated item carries use / form / misconception tags. An untagged item
  is a bug and must fail validation.
- Every MCQ distractor maps to a declared misconception. No filler distractors,
  no off-target errors like subject-verb agreement in an aspect exercise.
- No topic-specific logic in the generator. If something can't be expressed in
  topic_spec.json, extend the schema — don't special-case the code.

Start by writing the JSON Schema and the reference topic_spec, then the validator,
then the generator, then the UI. Show me the reference topic_spec for review
before building anything downstream.
```

---

## PART 6 — Runtime prompt template (one slot, one call)

Used by `generator/practice.ts` for each blueprint slot.

```
Generate ONE practice item.

Topic: {{topic.title}} ({{topic.cefr}})
Core idea: {{topic.core_idea}}

Slot:
  tier: {{slot.tier}}
  type: {{slot.type}}
  target use: {{slot.use_id}} — {{use.rule}}
  target misconception: {{slot.misconception_id}} — {{misconception.why}}
  difficulty: {{slot.difficulty}} of 3

Rules:
- The context must FORCE exactly one correct answer. Include a time marker,
  a discourse signal (Look!, Listen!, Every…), or a preceding clause that makes
  any other tense wrong. If a competent teacher could argue for a second answer,
  the item is invalid.
- Vocabulary at {{topic.cefr}} or one level below. No idioms.
- Context should be IELTS-relevant: study, work, hometown, hobbies, travel,
  technology. Neutral and usable for a learner in any country.
- Do not reuse any of these verbs: {{used_verbs}}
- For MCQ: exactly 3 options. Each wrong option must be generated from one of
  these misconceptions and be plausible enough that a B1 learner might pick it:
  {{topic.misconceptions}}. Tag each option with the misconception it represents.
- Feedback must explain WHY in one sentence, in learner-friendly language,
  and reference the rule, not the answer.

Return only JSON matching practice_item.json. No prose, no markdown fences.
```

---

## Quick priority order

If you can only do part of this now:

1. Add **stative verbs**, **signal words**, and **core idea** to the explanation spec — biggest teaching gain, lowest effort.
2. Fix the **Uzbek L1 claim** and move all L1 notes to a verified table.
3. Rebuild **distractors from misconception tags** — this unlocks diagnostic reporting.
4. Add the **ambiguity check** — this is the single validation gate that removes most bad generated items.
5. Then scale to 20 items and add the teacher layer.
