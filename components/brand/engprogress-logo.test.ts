/**
 * The letter a centre's logomark wears.
 *
 * One glyph, always — it is a logomark, not a monogram badge. The cases below
 * are the shapes real centre names in this market actually take: Latin, Cyrillic
 * and Uzbek Latin, names that open with a quotation mark or a number, and names
 * with leading whitespace from a paste.
 */

import { describe, expect, it } from "vitest";

import { centreInitials } from "./engprogress-logo";

describe("centreInitials", () => {
  it("takes the first letter, and only the first", () => {
    expect(centreInitials("Cambridge Academy")).toBe("C");
    expect(centreInitials("EngProgress")).toBe("E");
  });

  it("does not build a monogram from the first two words", () => {
    // The behaviour this replaced. "CA" says nothing "C" doesn't, and had to be
    // set ~30% smaller to fit the same square.
    expect(centreInitials("Cambridge Academy of Tashkent")).toHaveLength(1);
  });

  it("upper-cases a lower-case name", () => {
    expect(centreInitials("smart english")).toBe("S");
  });

  it("skips punctuation a name opens with", () => {
    // «Ilm» Markazi is an ordinary way to write a centre name here, and a mark
    // showing a guillemet is a mark showing nothing.
    expect(centreInitials("«Ilm» Markazi")).toBe("I");
    expect(centreInitials('"Bright" School')).toBe("B");
    expect(centreInitials("  Leading Space")).toBe("L");
  });

  it("handles non-Latin names", () => {
    expect(centreInitials("Прогресс")).toBe("П");
    expect(centreInitials("O‘zbek Ta’lim")).toBe("O");
  });

  it("keeps a leading digit rather than dropping to the fallback", () => {
    // "5-sonli maktab" is a real naming pattern; "5" is a better mark than "?".
    expect(centreInitials("5-sonli maktab")).toBe("5");
  });

  it("falls back rather than rendering an empty square", () => {
    expect(centreInitials("")).toBe("?");
    expect(centreInitials("   ")).toBe("?");
    expect(centreInitials("!!!")).toBe("?");
  });
});
