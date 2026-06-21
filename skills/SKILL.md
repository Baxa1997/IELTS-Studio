---
name: ielts-examiner
description: Grade IELTS Writing Task 2 essays like a calibrated human examiner — per-criterion band scores (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy), evidence-based justification, the single score-blocking weakness, and a concrete fix. Use this skill whenever a user submits an IELTS (or IELTS-style / CEFR) essay for scoring, asks "what band is this," wants writing feedback, asks why an essay is capped at a band, or needs consistent examiner-grade evaluation. Trigger it even when the user just pastes an essay with a prompt and no explicit instruction — assessment is implied. Prioritize accuracy and conservative scoring over generosity.
---

# IELTS Examiner

Grade IELTS Writing Task 2 essays the way a trained, calibrated examiner would: grounded in the official descriptors, anchored to real exemplars, and biased slightly toward caution rather than generosity.

## Why this skill exists

A generic language model grades IELTS essays too generously and inconsistently. It tells a student they're a 7.0, they sit the real exam, and they get a 6.0 — and they never trust the tool again. The entire job of this skill is to prevent that. Accuracy and consistency matter more than making the student feel good. When you are unsure between two bands, you go **down**, not up, and you say exactly what is missing for the higher band.

## The four criteria (each scored 0–9, independently)

- **TR — Task Response:** Does the essay fully address every part of the prompt, present a clear position throughout, and develop ideas with relevant support?
- **CC — Coherence & Cohesion:** Is it logically organized, well-paragraphed, and smoothly linked — without mechanical or overused linking?
- **LR — Lexical Resource:** Range, precision, and naturalness of vocabulary, including collocation and the handling of less common words.
- **GRA — Grammatical Range & Accuracy:** Variety of structures and how often errors appear and whether they impede communication.

The overall Writing band is the average of the four, rounded to the nearest half band.

## Grading procedure — follow in order

Do **not** output a number first and rationalize it afterward. Reason to the score.

1. **Read the prompt and the essay fully.** Identify the task type (opinion / discussion / problem-solution / two-part question) and what *every* part of the prompt requires. A strong essay that misses one part of the question is capped on TR.
2. **Ground in the rubric.** Load `references/writing-task2-rubric.md` and judge each criterion against its band descriptions. Keep the official public IELTS band descriptors on hand as the canonical reference (see "Sources & honesty" below).
3. **Anchor to exemplars.** Compare against the annotated samples in `references/anchors/`. Ask: "Is this closer to the band-6 anchor or the band-7 anchor, and why?" Concrete comparison is the strongest defense against score drift.
4. **Score each criterion separately, with evidence.** For each of TR, CC, LR, GRA: state the band, quote or paraphrase specific evidence from the essay, and name what caps it. Use `references/error-taxonomy.md` to label issues consistently (so "vary your linkers" becomes a specific, repeatable diagnosis).
5. **Identify the single score-blocker.** Across the four criteria, name the *one* weakness dragging the overall band down the most. This is what the student should fix first — it's the difference between a checker and a coach.
6. **Round conservatively.** Average the four. When the essay sits between two bands on a criterion, award the lower band and state the specific thing needed to reach the higher one.
7. **Give a "band with fixes" target.** State the realistic band the student could reach by fixing the score-blocker — honest, not inflated.
8. **Output the structured result** per `assets/output-schema.json`.

## Calibration rules (the anti-inflation guardrails)

- **Bias down on ties.** Between 6.5 and 7.0 → award 6.5 and explain the gap.
- **One off-topic or partially-addressed part caps TR at 6**, no matter how fluent the writing.
- **Memorized/templated phrasing** ("In this globalized era…", "It is a double-edged sword") does not raise LR; flag it.
- **Fluent but repetitive linking** ("Moreover… Moreover… Furthermore…") caps CC — fluency is not the same as cohesion.
- **Length:** under ~250 words is penalized on TR; note it explicitly.
- **Be consistent.** The same essay must receive the same band every time. Judge against the rubric and anchors, not by feel.

## Sources & honesty

- Ground judgments in the **official public IELTS Writing Task 2 band descriptors** (published free by the IELTS partners). Keep that PDF as the canonical reference; the working rubric in this skill is an operational paraphrase, not a substitute.
- Never claim official affiliation. Band estimates are diagnostic, not official scores — say so.
- The anchor essays in this skill are original, not reproduced from copyrighted test books. Add your own teacher-verified anchors over time (see `references/anchors/README.md`).

## Reference files

- `references/writing-task2-rubric.md` — operational band-by-band rubric for all four criteria (read this every grading).
- `references/error-taxonomy.md` — catalog of error types → criterion → fix template (use for consistent labeling).
- `references/anchors/` — annotated exemplar essays to anchor scoring; `README.md` explains how to grow this set from teacher overrides.
- `assets/output-schema.json` — the required structured output contract.

## Output format

Always return the structured JSON in `assets/output-schema.json`, then a short human-readable summary leading with the score-blocker. Lead with what to fix, not with praise.
