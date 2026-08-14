import { describe, expect, it } from "vitest";

import { gradeClosed, mergeOpenResults, worstTags } from "./grade";
import { matchesAny, normalizeVariants } from "./normalize";
import { sanitizeLessonHtml } from "./sanitize";
import type { Exercise, LessonContent } from "./types";

/**
 * The marking logic is the one part of Practice AI a learner feels directly:
 * a wrong mark is worse than no mark, and it is invisible in a typecheck. These
 * are the cases that actually come up — a phone's curly apostrophe, a British
 * spelling, a trailing full stop — plus the ones that must NOT be forgiven.
 */

const closed = (over: Partial<Exercise> = {}): Exercise =>
  ({
    id: "e1",
    type: "gap_fill",
    stage: "controlled",
    tag: "third-person-s",
    prompt: "She ___ (go) to school.",
    answers: ["goes"],
    ...over,
  }) as Exercise;

const lesson = (exercises: Exercise[]): LessonContent => ({
  meta: {
    title: "T",
    blueprint: "grammar",
    topic: "present simple",
    language: "en",
    objective: "o",
  },
  sections: [{ id: "s1", heading: "Form", html: "<p>x</p>" }],
  exercises,
});

describe("normalisation — forgives what is not being taught", () => {
  it("ignores case, spacing and a trailing full stop", () => {
    expect(matchesAny("  Goes. ", ["goes"])).toBe(true);
  });

  it("accepts the curly apostrophe a phone inserts", () => {
    expect(matchesAny("don’t", ["don't"])).toBe(true);
  });

  it("treats a contraction and its expansion as the same answer", () => {
    expect(matchesAny("do not", ["don't"])).toBe(true);
    expect(matchesAny("don't", ["do not"])).toBe(true);
  });

  it("keeps BOTH readings of an ambiguous contraction", () => {
    // he's is genuinely "he is" or "he has" — collapsing it to one would mark
    // the other wrong, which is why variants are a set rather than one form.
    const forms = normalizeVariants("he's");
    expect(forms.has("he is")).toBe(true);
    expect(forms.has("he has")).toBe(true);
  });

  it("accepts British and American spellings of the same word", () => {
    expect(matchesAny("colour", ["color"])).toBe(true);
    expect(matchesAny("organised", ["organized"])).toBe(true);
  });

  it("does NOT mangle words that merely look like a spelling variant", () => {
    // A naive `-our -> -or` rule turns "four" into "for"; a curated list cannot.
    expect(matchesAny("four", ["for"])).toBe(false);
    expect(matchesAny("advise", ["advice"])).toBe(false);
  });

  it("stops forgiving when the spelling IS the point", () => {
    expect(matchesAny("colour", ["color"], { strict: true })).toBe(false);
  });

  it("never counts an empty answer as right", () => {
    expect(matchesAny("", ["goes"])).toBe(false);
    expect(matchesAny("   ", ["goes"])).toBe(false);
  });
});

describe("closed marking", () => {
  it("marks a gap fill and tallies the teaching point", () => {
    const out = gradeClosed(lesson([closed()]), { e1: "Goes" });
    expect(out.score).toBe(1);
    expect(out.maxScore).toBe(1);
    expect(out.tagBreakdown["third-person-s"]).toEqual({ attempted: 1, correct: 1 });
  });

  it("accepts any of several listed answers", () => {
    const out = gradeClosed(lesson([closed({ answers: ["goes", "walks"] })]), { e1: "walks" });
    expect(out.score).toBe(1);
  });

  it("reports the expected answer as a human wrote it", () => {
    const out = gradeClosed(lesson([closed()]), { e1: "go" });
    expect(out.score).toBe(0);
    expect(out.results.e1).toMatchObject({ correct: false, given: "go", expected: "goes" });
  });

  it("shows the option TEXT for a wrong multiple choice, not its index", () => {
    const mcq = closed({
      id: "m1",
      type: "mcq_single",
      options: ["go", "goes", "going"],
      answers: ["1"],
    });
    const out = gradeClosed(lesson([mcq]), { m1: "0" });
    expect(out.results.m1).toMatchObject({ correct: false, expected: "goes" });
  });

  it("requires the whole set for a multi-answer question, in any order", () => {
    const multi = closed({
      id: "m2",
      type: "mcq_multi",
      options: ["a", "b", "c"],
      answers: ["0", "2"],
    });
    expect(gradeClosed(lesson([multi]), { m2: ["2", "0"] }).score).toBe(1);
    expect(gradeClosed(lesson([multi]), { m2: ["0"] }).score).toBe(0);
  });

  it("marks ordering on the sequence, not the set", () => {
    const ord = closed({ id: "o1", type: "ordering", answers: ["I", "am", "happy"] });
    expect(gradeClosed(lesson([ord]), { o1: ["I", "am", "happy"] }).score).toBe(1);
    expect(gradeClosed(lesson([ord]), { o1: ["am", "I", "happy"] }).score).toBe(0);
  });

  it("leaves open items unmarked and out of the total by default", () => {
    const open = {
      id: "w1",
      type: "write_sentence",
      stage: "freer",
      tag: "third-person-s",
      prompt: "Write one sentence.",
      criteria: ["third-person subject", "verb takes -s"],
      model_answer: "My brother leaves at seven.",
    } as unknown as Exercise;

    const out = gradeClosed(lesson([closed(), open]), { e1: "goes", w1: "He go home" });
    expect(out.maxScore).toBe(1); // the open item is excluded, not scored zero
    expect(out.pendingOpenIds).toEqual(["w1"]);
    expect(out.results.w1).toBeUndefined();
  });
});

describe("open marks folded in later", () => {
  const open = {
    id: "w1",
    type: "write_sentence",
    stage: "freer",
    tag: "third-person-s",
    prompt: "Write one sentence.",
    criteria: ["third-person subject", "verb takes -s"],
    model_answer: "My brother leaves at seven.",
  } as unknown as Exercise;

  it("adds one mark per criterion met, without disturbing the closed score", () => {
    const content = lesson([closed(), open]);
    const base = gradeClosed(content, { e1: "goes", w1: "He go home" });
    const merged = mergeOpenResults(base, content, {
      w1: {
        criteria: [
          { met: true, evidence: '"He"' },
          { met: false, evidence: '"go" — needs "goes"' },
        ],
        corrected: "He goes home.",
      },
    });
    expect(merged.score).toBe(2); // 1 closed + 1 criterion
    expect(merged.maxScore).toBe(3); // 1 closed + 2 criteria
    expect(merged.pendingOpenIds).toEqual([]);
  });

  it("counts the point as learned only when EVERY criterion is met", () => {
    const content = lesson([open]);
    const base = gradeClosed(content, { w1: "He go" });
    const partial = mergeOpenResults(base, content, {
      w1: { criteria: [{ met: true, evidence: "x" }, { met: false, evidence: "y" }] },
    });
    expect(partial.tagBreakdown["third-person-s"]).toEqual({ attempted: 1, correct: 0 });
  });
});

describe("worstTags", () => {
  it("ranks the points that cost the most marks", () => {
    expect(
      worstTags({ "third-person-s": { attempted: 4, correct: 1 }, articles: { attempted: 2, correct: 1 } }),
    ).toEqual(["third person s (3)", "articles (1)"]);
  });
});

describe("sanitiser", () => {
  it("keeps the markup a lesson is made of", () => {
    const out = sanitizeLessonHtml(
      "<h3>Form</h3><table><tr><td>I work</td></tr></table><p><strong>x</strong></p>",
    );
    expect(out).toContain("<h3>Form</h3>");
    expect(out).toContain("<td>I work</td>");
    expect(out).toContain("<strong>x</strong>");
  });

  it("removes scripts and event handlers", () => {
    const out = sanitizeLessonHtml('<p onclick="steal()">hi</p><script>steal()</script>');
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).toContain("hi");
  });

  it("drops links entirely — a shared lesson must not be a phishing hop", () => {
    const out = sanitizeLessonHtml('<p>see <a href="https://evil.test">this</a></p>');
    expect(out).not.toContain("<a");
    expect(out).toContain("see");
  });

  it("strips inline styles, which are a clickjacking surface", () => {
    expect(sanitizeLessonHtml('<div style="position:fixed;inset:0">x</div>')).not.toContain("style");
  });

  it("keeps our own lp- classes and discards anything else", () => {
    const out = sanitizeLessonHtml('<div class="lp-form cn-btn other">x</div>');
    expect(out).toContain("lp-form");
    expect(out).not.toContain("cn-btn");
  });
});
