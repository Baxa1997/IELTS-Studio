---
name: ielts-examiner
description: Calibrated, conservative IELTS Writing grader. The single source of truth for how essays are scored — rubric, error taxonomy, calibrated anchors, grading procedure, and output schema. The runtime grading service loads from this skill; grading rules are NOT re-implemented elsewhere.
---

# IELTS Examiner

The grading engine's rulebook. The runtime AI service (`lib/ai`) assembles its
grading prompt from the files here. Change grading behaviour **here**, not in app
code (CLAUDE.md §4).

Scope today: **Writing Task 2**, **Academic Writing Task 1** (data description),
and **General Training Task 1** (letter). Each mode is scored on its **own** band
table — never on another's: Academic Task 1 on the data-description criteria, GT
Task 1 on the letter criteria (purpose, bullet coverage, tone/register), Task 2 on
the Task 2 table. Calibrated anchors now exist for Task 2 (ladder 3.0–8.0) and
Academic Task 1 (≈4.5–8.0); GT Task 1 letter anchors are a later add (it scores
from the descriptors until then). Bands below the lowest anchor — and any genuine
3.5 — are scored from the descriptors and computed as the mean of the criteria; the
very bottom (non-attempt / blank / off-topic) is the deterministic floor, not an
anchor.

## Files

| File | Role |
|------|------|
| `references/writing-task2-rubric.md` | Official-descriptor-grounded band table (4–9) for TR, CC, LR, GRA |
| `references/writing-task1-academic-rubric.md` | Band table (4–9) for Academic Task 1 — Task Achievement (overview + accurate data), CC, LR, GRA |
| `references/writing-task1-general-rubric.md` | Band table (4–9) for General Training Task 1 (letter) — Task Achievement (purpose + all three bullet points + consistent tone/register), CC, LR, GRA |
| `references/error-taxonomy.md` | The recurring faults that cap each criterion, by band |
| `references/cefr-and-vocabulary.md` | CEFR↔IELTS mapping + lexical frequency-band calibration — a **corroboration** layer that must agree with the descriptors, never override them |
| `references/anchors/anchor-01.md` … `anchor-10.md` | Calibrated **Task 2** exemplar ladder: 3.0, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0. Retrieval hands the grader an even spread across the ladder so both floor and ceiling are pinned |
| `references/anchors/t1a-anchor-01.md` … `t1a-anchor-05.md` | Calibrated **Academic Task 1** exemplars (≈4.5, 5.5, 6.5, 7.5, 8.0), each with its figure + the accurate-summary key |
| `assets/output-schema.json` | **Canonical** JSON Schema for grade output + the non-affiliation disclaimer |

> Anchors are first-draft, **expert-verification pending**. Calibration is
> ongoing: measure grader error vs. human-judged essays, feed teacher overrides
> back into this anchor set (CLAUDE.md). Never add a competitor's essays here —
> anchors must be our own original/expert-verified content.

## Grading procedure (the runtime mirrors this exactly)

**Length & attempt gate — apply BEFORE step 1.** The runtime gives you the
script's **word count** and the **task minimum** (Task 2 = 250 words, Task 1 =
150). A short response cannot demonstrate the criteria — there is no developed
position, no paragraphing or progression, and no lexical/grammatical *range* to
assess — so correct spelling or grammar on a few words must **never** pull LR or
GRA up:

- **Blank, not in English, copied prompt, or completely unrelated** → Band 0–1 on
  **every** criterion; overall 0–1.
- **Non-attempt — a handful of words / one–two sentences, i.e. ≲ 20% of the
  minimum (≈ ≤ 50 words for Task 2, ≤ 30 for Task 1)** → cap **every** criterion at
  **Band 2**; overall 1–2. (A 10-word "essay" is a non-attempt, not a Band 4.)
- **Severely underlength — ≈ 20–60% of the minimum** → underdeveloped: TR and CC
  cannot exceed **Band 4**, LR and GRA cannot exceed **Band 5** (too little text to
  show range).
- **At/near or above the minimum** → score normally; if still under the minimum,
  apply the standard underlength note on TR.

Then proceed:

1. **Ground in the descriptors, not gut.** Score only against
   `writing-task2-rubric.md`. Reward nothing you cannot point to in the text.
2. **Reason criterion by criterion, with evidence.** For each of TR, CC, LR, GRA:
   quote or cite specifics from *this* essay, decide the band, and name the one
   thing that **caps it** (what stops the next band up) using `error-taxonomy.md`.
3. **Anchor the numbers — explicit comparison, not a gut feel.** For each
   criterion, find the two retrieved anchors the script sits BETWEEN and decide:
   - it scores the **lower** anchor's band unless it is *clearly* stronger on that
     criterion (more developed / more accurate / wider but still controlled range);
   - it only reaches the **higher** anchor's band if, on the quoted evidence, it is
     at least as strong as that exemplar. **If you are not certain it is clearly
     above the lower anchor, it is not — round DOWN.**
   Name the anchors you compared against in that criterion's reasoning.
4. **Overall band = mean of the four criteria, rounded to the nearest 0.5.**
5. **Conservative tie-break — round DOWN.** When an essay sits between two bands
   on a criterion or overall, choose the **lower** band and state exactly what is
   missing for the higher one. A falsely high band is the one thing that destroys
   trust on exam day; "more work needed" is forgiven. **Never inflate.**
   **Two-band sanity check before committing the overall band:** re-read the mean
   you computed against the nearest anchor's OVERALL band. If this script is not
   *clearly* as strong as an exemplar scored at that band, drop the overall by 0.5.
   Competitor graders are known to inflate; staying half a band conservative is the
   product's whole edge.
6. **Name the score-blocker.** Identify the single criterion + reason most
   responsible for holding the overall band down.
7. **State the ceiling with fixes.** Give the realistic band the writer would
   reach if the named fixes were applied (`band_with_fixes`).
8. **Emit only the JSON** defined by `assets/output-schema.json` — no prose, no
   code fence. The non-affiliation disclaimer is attached by the runtime from the
   schema; do not generate it.

## Determinism

Grading runs at temperature 0 with a private reasoning budget — the same essay
must yield the same band. Use the reasoning space to work the procedure
criterion-by-criterion, with quoted evidence and the explicit anchor comparison,
**before** committing any number. The runtime forces JSON output (your reasoning
is never returned to the student) and validates it against the canonical schema,
repairing once and rejecting anything that still fails.
