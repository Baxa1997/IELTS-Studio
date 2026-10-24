import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DICTIONARIES } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/lib/i18n/locales";
import { sourceFiles } from "@/test/source-files";

import { BACK_BY, backByLabel, noticeLocale } from "./notice";

/**
 * The service notice (2026-10-24): which language it speaks, the date it
 * promises, where it is mounted — and the one thing it could break, every
 * full-screen frame on the platform.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("the notice's language", () => {
  it("is the URL's on a localised page, whatever the visitor chose before", () => {
    for (const page of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
      for (const chosen of LOCALES) {
        expect(noticeLocale(localePath("/", page), chosen), `${page} page, chose ${chosen}`).toBe(
          page,
        );
        expect(
          noticeLocale(localePath("/how-to-use", page), chosen),
          `${page} page, chose ${chosen}`,
        ).toBe(page);
      }
    }
  });

  it("is the visitor's own everywhere else", () => {
    for (const path of ["/", "/dashboard", "/console", "/practice/cefr", "/sign-in"]) {
      for (const chosen of LOCALES) expect(noticeLocale(path, chosen), path).toBe(chosen);
    }
  });

  it("does not take a word that merely starts like a prefix", () => {
    expect(noticeLocale("/russia", DEFAULT_LOCALE)).toBe(DEFAULT_LOCALE);
    expect(noticeLocale("/uzbekistan-guide", DEFAULT_LOCALE)).toBe(DEFAULT_LOCALE);
  });
});

describe("the notice's words", () => {
  it("name the same return date in every language", () => {
    for (const locale of LOCALES) {
      expect(DICTIONARIES[locale]["notice.body"], locale).toContain("{date}");
      expect(backByLabel(locale), locale).toContain(String(BACK_BY.getUTCDate()));
    }
  });
});

describe("the root layout", () => {
  it("mounts the notice once, inside the locale provider, above the page", () => {
    const layout = read("app/layout.tsx").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(layout.match(/<ServiceNotice \/>/g)).toHaveLength(1);
    expect(layout).toMatch(/<LocaleProvider>\s*<ServiceNotice \/>\s*\{children\}/);
  });
});

describe("a full-screen frame", () => {
  /* Under the notice, a frame exactly 100dvh tall runs off the bottom by the
     notice's height: the document scrolls, and whatever the frame pins to its
     bottom edge is cut off. Such a frame takes SCREEN (lib/theme/tokens). A
     slide-over covers the whole screen, notice included, so it keeps 100dvh. */
  it("leaves room for the notice instead of taking a bare 100dvh", () => {
    const bare = /(?<![\w-])height:\s*"?100[ds]?vh\b|(?<![\w-])h-(?:screen|dvh|svh)\b/g;
    const offenders: string[] = [];
    for (const file of sourceFiles("app", "shared").filter((f) => /\.(tsx?|css)$/.test(f))) {
      if (/\.test\.tsx?$/.test(file)) continue;
      const src = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|\s)\/\/.*$/gm, "$1");
      for (const m of src.matchAll(bare)) {
        if (src.slice(Math.max(0, m.index - 400), m.index).includes('className="cn-slideover"'))
          continue;
        offenders.push(`${file}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
