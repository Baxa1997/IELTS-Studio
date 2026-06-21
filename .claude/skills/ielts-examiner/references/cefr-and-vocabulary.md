# CEFR alignment & lexical calibration

A **corroboration** layer for grading — a second, independent yardstick that
should *agree* with the official band descriptors. It never overrides them: if the
descriptor-based band and the CEFR/lexical read disagree, **trust the descriptors
and round down** (CLAUDE.md: conservative, never inflate). Use this to sanity-check
a band and to pitch generated content, not as a scoring rule of its own.

This file is **our own** guidance, grounded in the public CEFR framework (Council
of Europe) and the idea of academic-vocabulary frequency bands. It contains no
copyrighted test material or reproduced word lists.

---

## IELTS ↔ CEFR mapping (approximate)

| IELTS band | CEFR | One-line profile of a Task 2 script |
|------------|------|-------------------------------------|
| 4.0–5.0 | B1 | Conveys simple, relevant ideas; limited cohesion; errors are frequent and sometimes impede. |
| 5.5–6.5 | B2 | A clear line of argument; some flexibility and less-common vocabulary; recurrent errors surface under complexity. |
| 7.0–8.0 | C1 | Fluent, well-organised, flexible language; uncommon items used appropriately; errors are occasional, not systematic. |
| 8.5–9.0 | C2 | Effortless precision and range; virtually error-free; control attracts no attention. |

These bands are **broad and approximate** — never use the mapping to push a score
*up*. A script that "feels C1" but shows systematic article or agreement errors is
still being capped by GRA; band down to where the evidence sits.

## What each CEFR level looks like in the four criteria

- **B1 (≈ 4–5)** — TR: ideas relevant but under-developed and repetitive. CC:
  mechanical or missing progression. LR: high-frequency words, repeated; visible
  word-form/spelling errors. GRA: mostly simple sentences; complex attempts break.
- **B2 (≈ 5.5–6.5)** — TR: position clear, ideas extended but support stays
  general. CC: clear progression, cohesion sometimes mechanical. LR: adequate range
  with some less-common items and collocation slips. GRA: simple + complex mix;
  errors persist but rarely impede.
- **C1 (≈ 7–8)** — TR: developed, supported position throughout. CC: natural,
  well-managed cohesion. LR: regular, appropriate use of less-common/precise items.
  GRA: frequent error-free sentences; a few residual errors.
- **C2 (≈ 8.5–9)** — all four near-flawless; flexibility and precision are
  effortless.

---

## Lexical Resource: frequency-band calibration

A reliable, reproducible way to judge LR is to ask **where the candidate's
vocabulary sits on a frequency scale**, not whether it "sounds impressive":

1. **High-frequency general vocabulary** — the most common few thousand words of
   English. Sufficient for meaning; on its own (repeated, with slips) it reads
   Band 5.
2. **Academic / mid-frequency vocabulary** — the words that recur across academic
   writing regardless of topic. The public **Academic Word List (AWL, Coxhead)** —
   ~570 word families such as *analyse, significant, consequence, factor, approach,
   establish, constraint, derive* — is the standard reference for this band. (Use
   it as a reference for what "less common, academic" means; do not paste the list.)
3. **Lower-frequency / topic-precise vocabulary and natural collocation** — exact
   word choice and idiomatic combinations a strong writer reaches for.

**Banding heuristic (corroboration only):**

- **LR 5–6** — almost all from band 1, repetitive; a few band-2 items *attempted*,
  often with collocation or word-form slips.
- **LR 7** — band-2 (academic) items used **regularly and appropriately**, with
  awareness of collocation; occasional word-choice/spelling errors.
- **LR 8** — band-2 and band-3 items used **flexibly and precisely**, with natural
  collocation; errors are rare slips.

**Reward range only when it is ACCURATE.** A misused "big word" (LR-MEMORISED /
LR-WORDCHOICE in the taxonomy) does **not** raise LR — it can lower it. Memorised,
list-like vocabulary inserted without control is a Band-6 signal, not a Band-7 one.

---

## Generation guidance (pitching to a target band)

When generating prompts, passages or model content at a `target_band`, control the
vocabulary frequency to match:

- **Target ≤ 5.5** — lean on high-frequency vocabulary and short, clear sentences;
  keep ideas concrete.
- **Target 6–7** — introduce academic (AWL-level) vocabulary and a denser mix of
  complex structures and collocations.
- **Target 8+** — allow lower-frequency, topic-precise vocabulary and sophisticated
  but controlled structure.

This same scale lets the Reading generator pitch passage difficulty and lets the
coach suggest the *next* band of vocabulary a learner should reach for — always in
context, never as a memorised list.
