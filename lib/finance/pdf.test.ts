import { describe, expect, it } from "vitest";

import { buildPdf, ellipsize, textWidth, wrapText } from "./pdf";

describe("wrapText", () => {
  it("keeps every word", () => {
    // The whole point: nothing is dropped. Clipping loses the end of a
    // sentence, which on a report footer was the required IELTS disclaimer.
    const text = "Bands are this centre's assessment of practice work, not an official IELTS result.";
    const lines = wrapText(text, 180, 7.5);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe(text);
  });

  it("keeps every line inside the width it was given", () => {
    const lines = wrapText("the quick brown fox jumps over the lazy dog".repeat(4), 120, 9);
    for (const line of lines) expect(textWidth(line, 9)).toBeLessThanOrEqual(120);
  });

  it("cuts a single word too long to fit, because it has nowhere else to go", () => {
    const [line] = wrapText("Abdurahmonov-Toshkentboyev", 40, 9);
    expect(line.endsWith("...")).toBe(true);
    expect(textWidth(line, 9)).toBeLessThanOrEqual(40);
  });

  it("returns one empty line rather than nothing, so callers can loop safely", () => {
    expect(wrapText("", 100, 9)).toEqual([""]);
    expect(wrapText("   ", 100, 9)).toEqual([""]);
  });
});

describe("ellipsize", () => {
  it("leaves text that already fits alone", () => {
    expect(ellipsize("Writing", 200, 9)).toBe("Writing");
  });
});

describe("buildPdf", () => {
  const doc = {
    organization: "Bright Academy",
    title: "Aziza Karimova",
    tables: [
      {
        columns: [
          { header: "Skill", width: 1 },
          { header: "Band", width: 1, align: "right" as const },
        ],
        rows: Array.from({ length: 90 }, (_, i) => [`Row ${i}`, "6.0"]),
      },
    ],
    footer:
      "Bright Academy. Bands are this centre's assessment of practice work, not an official IELTS result. Not affiliated with or endorsed by IELTS.",
  };

  it("produces a file a reader will open", () => {
    const pdf = buildPdf(doc);
    expect(pdf.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
    expect(pdf.subarray(-6).toString("latin1").trim()).toBe("%%EOF");
  });

  it("paginates, and every page declares the same total", () => {
    const pdf = buildPdf(doc).toString("latin1");
    const pages = [...pdf.matchAll(/Page \d+ of (\d+)/g)];
    expect(pages.length).toBeGreaterThan(1);
    expect(new Set(pages.map((m) => m[1])).size).toBe(1);
    expect(Number(pages[0][1])).toBe(pages.length);
  });

  it("transliterates rather than dropping characters Helvetica cannot show", () => {
    // 'oʻzbek' must not silently become 'ozbek' in a name.
    const pdf = buildPdf({ ...doc, title: "Gʻafur Gʻulom" }).toString("latin1");
    expect(pdf).toContain("G'afur G'ulom");
  });
});
