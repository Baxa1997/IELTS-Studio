import { describe, expect, it } from "vitest";

import { composeTestSubtitle, composeTestTitle, titleCase } from "./titles";

/**
 * Title-casing a reading topic, guarded where it QUIETLY CORRUPTS THE CONTENT.
 *
 * `reading_passages.topic` is a lowercase sentence fragment, and the card now
 * title-cases it so the line matches the passage titles printed underneath.
 * Every failure below produces a card that renders perfectly and says something
 * slightly wrong, which nobody reviews once the feature "works":
 *
 *   1. A LOWERCASED ACRONYM. The ordinary way to write a title-caser is
 *      `word[0].toUpperCase() + word.slice(1).toLowerCase()`. Run that over the
 *      real library and "using AI and speech technology…" becomes "Using Ai…",
 *      "the UN report" becomes "The Un Report". The corpus has 50 tests of
 *      these; nobody is going to reread them.
 *
 *   2. A CAPITALISED POSSESSIVE. Split on anything that includes the
 *      apostrophe and "North America's" comes out "North America'S".
 *
 *   3. A CAPITALISED LIST JOINER. composeTestTitle glues three topics with
 *      ", " and " and ". Title-case the composed string instead of each topic
 *      and the card reads "A, B And C".
 */

describe("acronyms and proper nouns survive", () => {
  it("never lowercases a letter that is already capital", () => {
    // ⚠️ The one that silently rewrites the library.
    expect(titleCase("using AI and speech technology to revive endangered languages")).toBe(
      "Using AI and Speech Technology to Revive Endangered Languages",
    );
    expect(titleCase("what the UN says about CO2")).toBe("What the UN Says About CO2");
  });

  it("leaves a possessive alone", () => {
    expect(titleCase("the rise and abandonment of North America's largest ancient city")).toBe(
      "The Rise and Abandonment of North America's Largest Ancient City",
    );
  });

  it("keeps proper nouns that were already right", () => {
    expect(titleCase("the first telegraph cable across the Atlantic")).toBe(
      "The First Telegraph Cable Across the Atlantic",
    );
  });
});

describe("ordinary title case", () => {
  it("capitalises every word but the minor ones", () => {
    expect(titleCase("the science of sleep and why we need it")).toBe(
      "The Science of Sleep and Why We Need It",
    );
    expect(titleCase("mining the deep ocean for battery metals")).toBe(
      "Mining the Deep Ocean for Battery Metals",
    );
  });

  it("capitalises a minor word when it opens the topic", () => {
    // "a desert city…" must not render as "a Desert City…".
    expect(titleCase("a desert city of scholars and the rescue of its books")).toBe(
      "A Desert City of Scholars and the Rescue of Its Books",
    );
    expect(titleCase("the solar storm of 1859 and space weather today")).toBe(
      "The Solar Storm of 1859 and Space Weather Today",
    );
  });

  it("capitalises both halves of a hyphenated compound", () => {
    expect(titleCase("coral-reef restoration and long-span bridges")).toBe(
      "Coral-Reef Restoration and Long-Span Bridges",
    );
  });

  it("leaves a minor word lowercase inside a hyphenated compound", () => {
    expect(titleCase("the state-of-the-art in wind power")).toBe(
      "The State-of-the-Art in Wind Power",
    );
  });

  it("survives what the database can actually hand it", () => {
    for (const odd of ["", "   ", "a", "AI", "1859"]) {
      expect(() => titleCase(odd)).not.toThrow();
    }
    expect(titleCase("")).toBe("");
    expect(titleCase("a")).toBe("A");
  });
});

describe("the composed test title", () => {
  const topics = ["storing renewable energy", "coral-reef restoration", "the ecology of mangroves"];

  it("title-cases the topics and leaves the joiner alone", () => {
    /* ⚠️ The joiner is a minor word mid-title, so it stays lowercase — which
       only works because each topic is cased BEFORE being joined. Casing the
       composed string would produce "…, Coral-Reef Restoration And The…". */
    expect(composeTestTitle(topics)).toBe(
      "Storing Renewable Energy, Coral-Reef Restoration and The Ecology of Mangroves",
    );
  });

  it("still handles the shapes a test can degrade to", () => {
    expect(composeTestTitle([])).toBe("Academic Reading test");
    expect(composeTestTitle([null, undefined, "  "])).toBe("Academic Reading test");
    expect(composeTestTitle(["mining the deep ocean"])).toBe("Mining the Deep Ocean");
  });

  it("leaves the passage titles below it untouched", () => {
    /* They are already editorially cased, and re-casing them would flatten a
       deliberate capital or a subtitle's colon. */
    const titles = [
      "The Active Brain: How Modern Science Rewrote the Rules of Sleep",
      "DNA at Work",
    ];
    expect(composeTestSubtitle(titles)).toBe(
      "The Active Brain: How Modern Science Rewrote the Rules of Sleep · DNA at Work",
    );
  });
});
