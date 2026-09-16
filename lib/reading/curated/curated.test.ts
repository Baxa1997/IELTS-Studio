import { describe, expect, it } from "vitest";

import { codeCheckProblem, keyAlternatives } from "@/lib/reading/code-checks";
import { READING_QUESTION_TYPES } from "@/lib/reading/constants";
import { isCorrect, norm, PICK_TWO_KEY_RE, type GradableQuestion } from "@/lib/reading/grade";

import { CURATED_READING_PASSAGES, CURATED_READING_TESTS } from "./index";
import type { CuratedPassage, CuratedQuestion, CuratedTest } from "./shared";

/**
 * Hand-written library content goes straight to learners with no generator and no
 * teacher in between, so these tests stand in for both: the production code
 * checks, the grader marking each key as correct, the structural rules the runner
 * relies on to draw a block (one bank, one notes title, one word limit), and —
 * for full tests — the shape of a real exam paper.
 */

const COMPLETION = new Set(["sentence_completion", "summary_completion", "note_completion"]);
const SHARED_BANK = new Set([
  "matching_features",
  "matching_sentence_endings",
  "matching_headings",
  "matching_information",
]);

const TEST_PASSAGES = CURATED_READING_TESTS.flatMap((t) => t.passages);
const ALL_PASSAGES = [...CURATED_READING_PASSAGES, ...TEST_PASSAGES];

/** Runs of consecutive same-type questions, as the runner groups them. */
function blocks(questions: CuratedQuestion[]): CuratedQuestion[][] {
  const out: CuratedQuestion[][] = [];
  for (const q of questions) {
    const last = out[out.length - 1];
    if (last && last[0].type === q.type) last.push(q);
    else out.push([q]);
  }
  return out;
}

/** What the runner would submit for a learner who picked the right answer. */
function correctSubmission(q: CuratedQuestion, pairIndex: number): string {
  if (q.type === "multiple_choice" && PICK_TWO_KEY_RE.test(q.answer)) {
    return q.answer.split(/\s+or\s+/i)[pairIndex];
  }
  if (COMPLETION.has(q.type) && !q.options?.length) return keyAlternatives(q.answer)[0];
  return q.answer;
}

function words(body: string): number {
  return body.trim().split(/\s+/).length;
}

function checkPassage(p: CuratedPassage) {
  describe(p.title, () => {
    it("is exam length with a full question set", () => {
      expect(words(p.body)).toBeGreaterThanOrEqual(700);
      expect(words(p.body)).toBeLessThanOrEqual(1000);
      expect(p.questions.length).toBeGreaterThanOrEqual(13);
      expect(p.questions.length).toBeLessThanOrEqual(15);
      expect(p.difficulty).toBeGreaterThanOrEqual(4);
      expect(p.difficulty).toBeLessThanOrEqual(9);
    });

    it("keeps each question type in one contiguous block", () => {
      const types = blocks(p.questions).map((b) => b[0].type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("passes the production code checks", () => {
      let slot = 0;
      for (const q of p.questions) {
        const pair = q.type === "multiple_choice" && PICK_TWO_KEY_RE.test(q.answer);
        // Production checks each row of a choose-two pair on its OWN answer,
        // before forcePickTwoPairs folds the two into one "A or C" key.
        const answer = pair ? q.answer.split(/\s+or\s+/i)[slot] : q.answer;
        slot = pair ? (slot + 1) % 2 : 0;
        expect(codeCheckProblem({ ...q, answer, number: 1 }, p.body), q.prompt).toBeNull();
      }
    });

    it("is marked correct by the grader when answered with its own key", () => {
      let pair = 0;
      p.questions.forEach((q, i) => {
        const isPair = q.type === "multiple_choice" && PICK_TWO_KEY_RE.test(q.answer);
        const gradable: GradableQuestion = {
          id: `${p.key}-${i}`,
          question_type: q.type,
          order_index: i + 1,
          prompt: q.prompt,
          options: q.options,
          answer_key: q.answer,
          supporting_sentence: q.supporting_sentence,
          explanation: q.explanation,
        };
        expect(isCorrect(gradable, correctSubmission(q, isPair ? pair : 0)), q.prompt).toBe(true);
        pair = isPair ? (pair + 1) % 2 : 0;
      });
    });

    it("proves every answer, except Not Given, with a sentence from the passage", () => {
      for (const q of p.questions) {
        const notGiven = norm(q.answer) === "not given";
        expect(q.supporting_sentence === "", q.prompt).toBe(notGiven);
        expect(q.explanation.length, q.prompt).toBeGreaterThan(10);
      }
    });

    it("takes completion answers word for word from the passage", () => {
      for (const q of p.questions) {
        if (!COMPLETION.has(q.type) || q.options?.length) continue;
        const found = keyAlternatives(q.answer).some((a) => norm(p.body).includes(norm(a)));
        expect(found, q.prompt).toBe(true);
        expect(
          norm(q.supporting_sentence).includes(norm(keyAlternatives(q.answer)[0])),
          q.prompt,
        ).toBe(true);
      }
    });

    it("gives each block one bank, one notes title and one word limit", () => {
      for (const block of blocks(p.questions)) {
        const first = block[0];
        for (const q of block) {
          expect(q.word_limit, q.prompt).toBe(first.word_limit);
          if (SHARED_BANK.has(q.type) || (q.type === "summary_completion" && first.options)) {
            expect(q.options, q.prompt).toEqual(first.options);
          }
          if (q.type === "note_completion") {
            expect(q.note_meta?.title, q.prompt).toBe(first.note_meta?.title);
            expect(q.note_meta?.title, q.prompt).toBeTruthy();
            expect(q.note_meta?.layout, q.prompt).toBe(first.note_meta?.layout);
          } else {
            expect(q.note_meta, q.prompt).toBeNull();
            expect(q.section, q.prompt).toBeNull();
          }
          expect(
            COMPLETION.has(q.type) && !q.options ? q.word_limit !== null : q.word_limit === null,
            q.prompt,
          ).toBe(true);
        }
        // Banks offer more choices than there are questions, so one can't be
        // answered by elimination.
        if (
          ["matching_sentence_endings", "matching_headings", "summary_completion"].includes(
            first.type,
          ) &&
          first.options
        ) {
          expect(first.options.length, first.prompt).toBeGreaterThan(block.length);
        }
      }
    });

    it("letters the paragraphs only when a question refers to them", () => {
      const byLetter = p.questions.some(
        (q) => q.type === "matching_information" || q.type === "matching_headings",
      );
      const labels = p.body.split(/\n\s*\n/).map((para) => /^([A-J])\) /.exec(para)?.[1] ?? null);
      if (byLetter) {
        expect(labels.every(Boolean)).toBe(true);
        expect(labels.join("")).toBe("ABCDEFGHIJ".slice(0, labels.length));
        for (const q of p.questions.filter((x) => x.type === "matching_information")) {
          expect(q.options).toEqual(labels);
        }
      } else {
        expect(labels.some(Boolean)).toBe(false);
      }
    });

    it("builds choose-two pairs from one stem, five options and two different letters", () => {
      const pairs = p.questions.filter(
        (q) => q.type === "multiple_choice" && PICK_TWO_KEY_RE.test(q.answer),
      );
      expect(pairs.length % 2).toBe(0);
      for (let i = 0; i < pairs.length; i += 2) {
        const [a, b] = [pairs[i], pairs[i + 1]];
        expect(b.prompt).toBe(a.prompt);
        expect(b.options).toEqual(a.options);
        expect(b.answer).toBe(a.answer);
        expect(a.options?.length).toBe(5);
        const [x, y] = a.answer.split(/\s+or\s+/i);
        expect(x).not.toBe(y);
        expect(a.supporting_sentence).not.toBe(b.supporting_sentence);
      }
    });
  });
}

/** The shape of a real paper (Cambridge 19–21): see FULL_TEST_LAYOUTS in lib/reading/constants. */
function checkTest(t: CuratedTest) {
  describe(`full test ${t.key}`, () => {
    const [p1, p2, p3] = t.passages;
    const types = (p: CuratedPassage) => new Set(p.questions.map((q) => q.type));

    it("has 13, 13 and 14 questions — 40 in all", () => {
      expect(t.passages.map((p) => p.questions.length)).toEqual([13, 13, 14]);
    });

    it("rises in difficulty around its target band", () => {
      expect(p1.difficulty).toBeLessThanOrEqual(p2.difficulty);
      expect(p2.difficulty).toBeLessThanOrEqual(p3.difficulty);
      expect(p1.difficulty).toBeLessThan(p3.difficulty);
      expect(t.targetBand).toBe(p2.difficulty);
    });

    it("opens with True/False/Not Given and a completion task", () => {
      expect(types(p1).has("true_false_not_given")).toBe(true);
      expect([...types(p1)].some((type) => COMPLETION.has(type))).toBe(true);
    });

    it("keeps writer's-views and paragraph-matching questions out of the easier passages", () => {
      expect(types(p1).has("yes_no_not_given")).toBe(false);
      expect(types(p2).has("yes_no_not_given")).toBe(false);
      expect(types(p1).has("matching_information")).toBe(false);
    });

    it("gives its three passages three different subjects", () => {
      expect(new Set(t.passages.map((p) => p.topic)).size).toBe(3);
    });
  });
}

describe("curated reading library", () => {
  it("never repeats a key or a title anywhere in the library", () => {
    const keys = [...ALL_PASSAGES.map((p) => p.key), ...CURATED_READING_TESTS.map((t) => t.key)];
    const titles = ALL_PASSAGES.map((p) => p.title);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("practises every question type the exam uses in the standalone passages", () => {
    const seen = new Set(CURATED_READING_PASSAGES.flatMap((p) => p.questions.map((q) => q.type)));
    expect([...seen].sort()).toEqual([...READING_QUESTION_TYPES].sort());
  });

  it("spans accessible to demanding passages", () => {
    const bands = CURATED_READING_PASSAGES.map((p) => p.difficulty);
    expect(Math.min(...bands)).toBeLessThanOrEqual(5);
    expect(Math.max(...bands)).toBeGreaterThanOrEqual(8);
  });

  for (const p of ALL_PASSAGES) checkPassage(p);
  for (const t of CURATED_READING_TESTS) checkTest(t);
});
