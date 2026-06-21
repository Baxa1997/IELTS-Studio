# Grader calibration set

Teacher-labeled essays used to prove the grader is **accurate and not inflating**.
Each run measures the model's band against a known human band and reports the two
numbers that matter (CLAUDE.md §2):

- **MAE** — mean absolute error vs the human band (how far off, either direction).
- **Inflation bias** — mean _signed_ error (`model − human`). **Positive = grading
  too high.** A calibrated, conservative grader sits at or below zero.

Targets: **MAE ≤ 0.5** and **bias ≤ 0** (not upward). The harness exits non-zero if
either misses, so it can gate CI.

## Format

One `*.json` file per essay (or an array of cases in a single file):

```json
{
  "prompt": "The question/task the student was answering.",
  "essay": "The student's full essay text.",
  "human_band": 6.5,
  "task_type": "task2"
}
```

- `task_type` is optional and defaults to `task2`
  (`task1_academic` | `task1_general` | `task2`).
- Field aliases are accepted: `prompt_text`/`promptText`, `essay_text`/`essayText`,
  `band`/`humanBand`, `taskType`. Optional `id`/`name` labels the row.

## Building the set

- Use **your own** essays graded by a real examiner — this is the held-out human
  truth the grader is measured against. Strip PII; get consent (CLAUDE.md §IP).
- **Never** add Cambridge/Oxford/official past-paper essays — copyrighted
  (CLAUDE.md IP boundary).
- Spread cases across the band range (5.0–8.0+). Bias hides in the tails: a grader
  can look fine on average while inflating weak essays specifically.
- Aim for enough per band that the aggregate isn't one essay's noise.

`example.json` is an original sample so the harness runs out of the box; its
`human_band` is illustrative — replace it with examiner-scored essays.

## Run

```bash
npm run calibrate -- ./calibration
npm run calibrate -- ./calibration --json   # also print machine-readable results
```
