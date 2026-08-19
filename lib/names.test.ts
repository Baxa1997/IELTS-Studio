import { describe, expect, it } from "vitest";

import { nameLooksLike, nameTokens, transliterate } from "./names";

/**
 * The tie-break that separates two siblings on one phone.
 *
 * Deliberately generous, and these tests pin WHY that is safe: it only ever
 * chooses between people already proved to share a number. The same generosity
 * would be reckless as a general identity check — which is what the last block
 * here is guarding against.
 */

describe("names as this roster actually spells them", () => {
  it("matches the transliterations of one person", () => {
    // All three are one student in the live database.
    expect(nameLooksLike("Bakhriddin Nurullayev", "Bakhriddin Nurullaev")).toBe(true);
    expect(nameLooksLike("bakhriddin", "Bakhriddin Nurullaev")).toBe(true);
  });

  it("matches across Cyrillic and Latin", () => {
    expect(nameLooksLike("Азиза", "Aziza Karimova")).toBe(true);
  });

  it("does not care about word order", () => {
    expect(nameLooksLike("Karimova Aziza", "Aziza Karimova")).toBe(true);
  });

  it("ignores the apostrophes Uzbek Latin uses", () => {
    expect(nameLooksLike("Gulnora", "Gʻulnora")).toBe(true);
  });
});

describe("what it still separates", () => {
  it("two different siblings", () => {
    expect(nameLooksLike("Aziza", "Bekzod Karimov")).toBe(false);
  });

  it("nothing typed", () => {
    expect(nameLooksLike("", "Aziza Karimova")).toBe(false);
    expect(nameLooksLike("  ", "Aziza Karimova")).toBe(false);
  });

  it("a single letter, which would otherwise match almost anything", () => {
    expect(nameTokens("a b c")).toEqual([]);
    expect(nameLooksLike("a", "Aziza Karimova")).toBe(false);
  });
});

describe("transliteration", () => {
  it("folds Cyrillic and accents to comparable latin", () => {
    expect(transliterate("Азиза")).toBe("aziza");
    expect(transliterate("Ўзбек")).toBe("ozbek");
  });
});
