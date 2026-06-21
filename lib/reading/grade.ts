/**
 * Objective auto-grading for reading attempts + raw-score → band conversion.
 *
 * Pure, deterministic, no I/O and no `server-only` — the submit route uses it and
 * it stays unit-testable. The model is NOT in the loop here: an answer is right or
 * wrong by string comparison against the stored answer key, which is the whole
 * point of reading (unlike writing, there's a defensible single answer).
 *
 * Two jobs:
 *   1. gradeReadingAttempt — compare each answer, build the per-question review
 *      (with the proving sentence + trap explanation for wrong ones) and the
 *      per-TYPE tally we persist for targeting weak areas later.
 *   2. rawScoreToBand — convert correct/total to an IELTS band, conservatively
 *      (CLAUDE.md: never inflate — round DOWN when between bands).
 */

import type { ReadingQuestionType } from "./types";

// ---- Shapes ----------------------------------------------------------------

/** What the grader needs to know about a question (server-side; includes the key). */
export interface GradableQuestion {
  id: string;
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  options: string[] | null;
  answer_key: string;
  supporting_sentence: string;
  explanation: string;
  /** Full-test only: which passage (1..3) and its title, for grouping results. */
  passage_order?: number;
  passage_title?: string;
}

/** One graded question, post-submit — safe to reveal to the student now. */
export interface GradedItem {
  id: string;
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  options: string[] | null;
  student_answer: string;
  /** Human-readable correct answer (resolved from a letter/numeral to its text). */
  correct_answer: string;
  is_correct: boolean;
  /** The verbatim passage sentence that proves the answer (empty for Not Given). */
  supporting_sentence: string;
  /** Why this is the answer / why the wrong options trap you. */
  explanation: string;
  /** Full-test only: which passage (1..3) and its title this item belongs to. */
  passage_order?: number;
  passage_title?: string;
}

/** Per-type attempted/correct tally — persisted so we can target weak types. */
export type TypeBreakdown = Partial<Record<ReadingQuestionType, { attempted: number; correct: number }>>;

export interface ReadingGrade {
  total: number;
  correctCount: number;
  /** 0..100, two decimals. */
  percent: number;
  band: number;
  typeBreakdown: TypeBreakdown;
  items: GradedItem[];
}

// ---- Grade -----------------------------------------------------------------

/**
 * Grade a whole attempt. `answers` is keyed by question id; a missing/blank entry
 * is simply wrong. Items come back in question order.
 */
export function gradeReadingAttempt(
  questions: GradableQuestion[],
  answers: Record<string, string>,
): ReadingGrade {
  const ordered = [...questions].sort((a, b) => a.order_index - b.order_index);
  const breakdown: TypeBreakdown = {};
  let correctCount = 0;

  const items: GradedItem[] = ordered.map((q) => {
    const raw = (answers[q.id] ?? "").trim();
    const correct = isCorrect(q, raw);
    if (correct) correctCount += 1;

    const tally = (breakdown[q.question_type] ??= { attempted: 0, correct: 0 });
    tally.attempted += 1;
    if (correct) tally.correct += 1;

    return {
      id: q.id,
      question_type: q.question_type,
      order_index: q.order_index,
      prompt: q.prompt,
      options: q.options,
      student_answer: raw,
      correct_answer: resolveCorrectText(q.options, q.answer_key),
      is_correct: correct,
      supporting_sentence: q.supporting_sentence ?? "",
      explanation: q.explanation ?? "",
      passage_order: q.passage_order,
      passage_title: q.passage_title,
    };
  });

  const total = ordered.length;
  const percent = total === 0 ? 0 : Math.round((correctCount / total) * 10000) / 100;

  return { total, correctCount, percent, band: rawScoreToBand(correctCount, total), typeBreakdown: breakdown, items };
}

/** A passage's score within a full test, for the per-passage results breakdown. */
export interface PassageTally {
  order: number;
  title: string;
  total: number;
  correctCount: number;
}

export interface ReadingTestGrade extends ReadingGrade {
  /** Per-passage tallies, in passage order (sums to the test total). */
  passages: PassageTally[];
}

/**
 * Grade a full 3-passage test. Questions span all passages and each carries its
 * `passage_order`/`passage_title`. Items are ordered by (passage, order_index) so
 * the global question numbering matches the runner. The band is converted ONCE
 * over the whole ~40-question total — that is the real IELTS raw-score table, and
 * banding the full set (not a single passage) is the conservative, correct move.
 */
export function gradeReadingTest(
  questions: GradableQuestion[],
  answers: Record<string, string>,
): ReadingTestGrade {
  const ordered = [...questions].sort(
    (a, b) => (a.passage_order ?? 0) - (b.passage_order ?? 0) || a.order_index - b.order_index,
  );

  // Grade the flat set with the same objective marker, then re-derive per-passage
  // tallies from the graded items (one source of truth for correctness).
  const flat = gradeReadingAttempt(ordered, answers);
  // gradeReadingAttempt re-sorts by order_index only; restore (passage, index) order.
  const items = [...flat.items].sort(
    (a, b) => (a.passage_order ?? 0) - (b.passage_order ?? 0) || a.order_index - b.order_index,
  );

  const byPassage = new Map<number, PassageTally>();
  for (const it of items) {
    const order = it.passage_order ?? 1;
    const tally = byPassage.get(order) ?? { order, title: it.passage_title ?? `Passage ${order}`, total: 0, correctCount: 0 };
    tally.total += 1;
    if (it.is_correct) tally.correctCount += 1;
    byPassage.set(order, tally);
  }
  const passages = [...byPassage.values()].sort((a, b) => a.order - b.order);

  return { ...flat, items, passages };
}

/** True iff the student's raw answer matches the question's key, per type. */
export function isCorrect(q: GradableQuestion, studentAnswer: string): boolean {
  const student = norm(studentAnswer);
  if (!student) return false;

  switch (q.question_type) {
    case "true_false_not_given":
    case "yes_no_not_given":
      return canonVerdict(student) === canonVerdict(q.answer_key) && canonVerdict(student) !== "";

    case "multiple_choice":
    case "matching_headings":
    case "matching_information": {
      // Accept the option text, or the bare letter/roman the key may use.
      const correctText = norm(resolveCorrectText(q.options, q.answer_key));
      return student === correctText || student === norm(q.answer_key);
    }

    case "sentence_completion":
    case "summary_completion":
    default: {
      // Typed free-text. Real IELTS marks an answer right regardless of a leading
      // article or whether a number is written as a figure or a word, and accepts
      // any alternative the key explicitly lists. We mirror that on BOTH sides:
      // expand the key into every accepted form, then see if any equivalent form of
      // the student's answer is among them. Plurals/spelling are NOT smoothed over —
      // IELTS penalises those, and softening them would inflate (CLAUDE.md).
      const accepted = acceptedKeyForms(q.answer_key);
      for (const form of variants(student)) {
        if (accepted.has(form)) return true;
      }
      return false;
    }
  }
}

// ---- Band conversion -------------------------------------------------------

// Percent thresholds derived from the official IELTS Academic Reading raw-score
// band table (out of 40), using the LOWER bound of each band's raw range as a
// fraction of 40 — e.g. band 7 needs 30/40 = 75%. Using the lower bound keeps the
// mapping conservative (you must clear the band, not merely approach it), which is
// exactly the anti-inflation stance. Descending; first threshold ≤ percent wins.
const BAND_THRESHOLDS: ReadonlyArray<readonly [number, number]> = [
  [0.975, 9.0],
  [0.925, 8.5],
  [0.875, 8.0],
  [0.825, 7.5],
  [0.75, 7.0],
  [0.675, 6.5],
  [0.575, 6.0],
  [0.475, 5.5],
  [0.375, 5.0],
  [0.325, 4.5],
  [0.25, 4.0],
  [0.2, 3.5],
  [0.15, 3.0],
  [0.1, 2.5],
];

/**
 * Convert correct/total to an indicative IELTS band. Conservative by construction
 * (thresholds are the band's lower bound). Returns 0 only for an empty set; the
 * published table floors at 2.5, so anything answered lands ≥ 2.5.
 */
export function rawScoreToBand(correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = correct / total;
  for (const [threshold, band] of BAND_THRESHOLDS) {
    if (ratio >= threshold) return band;
  }
  return 2.5;
}

// ---- Answer normalization --------------------------------------------------

/** Lowercase, unify quotes, fold the dash family to spaces (so "well-being" and
 *  "well being" match), drop punctuation, collapse whitespace. Applied to both
 *  sides of every comparison so formatting never decides correctness. */
function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’‛′`]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[-‐‑‒–—―]/g, " ")
    .replace(/[.,;:!?'"()\[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map any spelling of a TFNG/YNNG verdict onto a canonical token. */
function canonVerdict(s: string): "true" | "false" | "yes" | "no" | "not_given" | "" {
  const n = norm(s).replace(/[\s_]+/g, "");
  if (["ng", "notgiven", "ngiven"].includes(n)) return "not_given";
  if (["true", "t"].includes(n)) return "true";
  if (["false", "f"].includes(n)) return "false";
  if (["yes", "y"].includes(n)) return "yes";
  if (["no", "n"].includes(n)) return "no";
  return "";
}

/**
 * Expand a stored completion key into EVERY form we'll accept, normalized. Folds
 * three author conventions plus the two IELTS-fair leniencies into one set:
 *   • alternatives the key lists:   "colour/color", "father or dad", "12; twelve"
 *   • optional parts in parens:     "(the) printing press", "ancient (Roman) wall"
 *   • leading article optional:     key "brain" also accepts "the brain", & vice-versa
 *   • number as figure or word:     key "12" also accepts "twelve", & vice-versa
 * Plurals and spelling are deliberately NOT folded — IELTS penalises them.
 */
function acceptedKeyForms(key: string): Set<string> {
  const out = new Set<string>();
  for (const alt of splitAlternatives(key)) {
    for (const expanded of expandOptionalParens(alt)) {
      for (const form of variants(norm(expanded))) out.add(form);
    }
  }
  out.delete("");
  return out;
}

/** Every equivalent normalized form of one phrase: itself, the same phrase without
 *  a leading a/an/the, and the figure⇄word counterpart of a small whole number. */
function variants(phrase: string): Set<string> {
  const set = new Set<string>();
  if (!phrase) return set;
  const bases = [phrase];
  const dearticled = phrase.replace(/^(?:a|an|the)\s+/, "");
  if (dearticled !== phrase) bases.push(dearticled);
  for (const b of bases) {
    set.add(b);
    for (const n of numberForms(b)) set.add(n);
  }
  return set;
}

/** Split a key on author-written alternative separators: "/", " or ", ";". */
function splitAlternatives(key: string): string[] {
  return key.split(/\s*\/\s*|\s+or\s+|\s*;\s*/i).map((s) => s.trim()).filter(Boolean);
}

/** Treat each "(...)" group as optional, returning every include/exclude combo.
 *  "(the) Roman (concrete)" → ["the Roman concrete","the Roman","Roman concrete","Roman"]. */
function expandOptionalParens(s: string): string[] {
  const m = s.match(/\(([^)]*)\)/);
  if (!m) return [s];
  const before = s.slice(0, m.index);
  const after = s.slice((m.index ?? 0) + m[0].length);
  return [...expandOptionalParens(before + m[1] + after), ...expandOptionalParens(before + after)];
}

// ---- Small-number figure ⇄ word equivalence (covers 0–99) ------------------

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const WORD_TO_NUM: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  ONES.forEach((w, i) => (m[w] = i));
  TENS.forEach((w, i) => w && (m[w] = i * 10));
  return m;
})();

/** The figure⇄word counterpart(s) of a phrase that is a whole number 0–99. */
function numberForms(phrase: string): string[] {
  if (/^\d{1,2}$/.test(phrase)) {
    const w = numberToWords(parseInt(phrase, 10));
    return w ? [w] : [];
  }
  const n = wordsToNumber(phrase);
  return n != null ? [String(n)] : [];
}

function numberToWords(n: number): string | null {
  if (n < 0 || n > 99) return null;
  if (n < 20) return ONES[n];
  const u = n % 10;
  return u === 0 ? TENS[Math.floor(n / 10)] : `${TENS[Math.floor(n / 10)]} ${ONES[u]}`;
}

/** "twenty" → 20, "twenty one" → 21 (norm already folds the hyphen to a space). */
function wordsToNumber(phrase: string): number | null {
  const toks = phrase.split(" ");
  if (toks.length === 1) return toks[0] in WORD_TO_NUM ? WORD_TO_NUM[toks[0]] : null;
  if (toks.length === 2) {
    const tens = WORD_TO_NUM[toks[0]];
    const unit = WORD_TO_NUM[toks[1]];
    if (tens != null && tens >= 20 && tens % 10 === 0 && unit != null && unit >= 1 && unit <= 9) return tens + unit;
  }
  return null;
}

/**
 * Resolve a choice/matching key to its human-readable option text. The key may be
 * the option text itself, a letter (A, b…), or a roman numeral (i, ii…) indexing
 * into the bank. Falls back to the raw key (completion answers have no options).
 */
export function resolveCorrectText(options: string[] | null, answerKey: string): string {
  const key = answerKey.trim();
  if (!options || options.length === 0) return key;

  const keyNorm = norm(key);
  const direct = options.find((o) => norm(o) === keyNorm);
  if (direct) return direct;

  const li = letterToIndex(keyNorm);
  if (li != null && li < options.length) return options[li];

  const ri = romanToIndex(keyNorm);
  if (ri != null && ri < options.length) return options[ri];

  return key;
}

/** 'a'→0 … 'z'→25, for single-letter option keys; null otherwise. */
function letterToIndex(s: string): number | null {
  if (/^[a-z]$/.test(s)) return s.charCodeAt(0) - 97;
  return null;
}

const ROMAN: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6, viii: 7, ix: 8, x: 9,
  xi: 10, xii: 11, xiii: 12, xiv: 13, xv: 14,
};
/** lowercase roman numeral → 0-based index (matching-headings banks use these). */
function romanToIndex(s: string): number | null {
  return s in ROMAN ? ROMAN[s] : null;
}
