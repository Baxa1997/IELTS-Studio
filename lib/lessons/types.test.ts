import { describe, expect, it } from "vitest";

import { lessonContentSchema } from "./types";

/**
 * The stored-document contract.
 *
 * A lesson is parsed before it is rendered, and `loadLesson` returns null when
 * the parse fails — which the page turns into a 404. So a document the engine
 * will happily store but this schema will not accept does not degrade, it
 * DELETES the page. Two of fifteen stored lessons were dead exactly that way
 * before these tests existed.
 */

const section = { id: "core_idea", heading: "The one idea", html: "<p>ok</p>" };
const meta = {
  title: "T", blueprint: "grammar", topic: "t", language: "en",
  objective: "By the end you can do it.",
};

function lessonWith(options: string[]) {
  return {
    meta,
    sections: [section],
    exercises: [
      {
        id: "o1", type: "ordering", stage: "semi_controlled", tag: "word-order",
        prompt: "Put the words in order:", options,
        answers: options.map((_, i) => String(i)),
      },
    ],
  };
}

describe("options", () => {
  it("accepts a whole sentence to rearrange", () => {
    // `ordering` holds one entry per WORD. The cap was 8, written when this
    // field only ever held multiple-choice options, and a twelve-word sentence
    // 404'd the lesson it was in.
    const words = "Despite the fact that plastic packaging is cheap it harms the environment"
      .split(" ");
    expect(words.length).toBe(12);
    expect(lessonContentSchema.safeParse(lessonWith(words)).success).toBe(true);
  });

  it("accepts up to the shared ceiling of 24", () => {
    const words = Array.from({ length: 24 }, (_, i) => `w${i}`);
    expect(lessonContentSchema.safeParse(lessonWith(words)).success).toBe(true);
  });

  it("refuses more than the ceiling", () => {
    // MIRRORS MAX_SEQUENCE_OPTIONS in the engine's lessons/validate.py. If one
    // moves and the other does not, the engine stores what this cannot read.
    const words = Array.from({ length: 25 }, (_, i) => `w${i}`);
    expect(lessonContentSchema.safeParse(lessonWith(words)).success).toBe(false);
  });
});

describe("sections", () => {
  it("accepts the twelve a grammar lesson can now emit", () => {
    const sections = Array.from({ length: 12 }, (_, i) => ({ ...section, id: `s${i}` }));
    const doc = { ...lessonWith(["a", "b"]), sections };
    expect(lessonContentSchema.safeParse(doc).success).toBe(true);
  });
});
