import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LOCALES, type Locale } from "@/lib/i18n/locales";

import { docsCopy } from "./index";
import type { DocPoint, DocTabCopy } from "./types";

/**
 * The two documentation guides, in three languages.
 *
 * THE TYPES ALREADY DO THE STRUCTURAL WORK — `uz.ts` and `ru.ts` do not compile
 * until they carry every field, and the tuples make a dropped paragraph a type
 * error. What the types CANNOT see is the failure that actually happens when
 * somebody is halfway through a translation: the field is present, the file
 * compiles, and the value is still the English sentence. That renders as a
 * Russian page with an English paragraph in the middle of it, which nothing
 * reports because nothing is broken.
 *
 * So these checks are about CONTENT, not shape.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const learnerGuide = read("../../_components/learner-guide.tsx");
const centersGuide = read("../../education-centers/_components/centers-guide.tsx");

/** Long enough that two languages agreeing on it word for word is a mistake
 *  rather than a coincidence. "Telegram" and "CEFR / Multilevel" are not. */
const LONG = 60;

function tabsOf(c: { tabs: Record<string, DocTabCopy> }): DocTabCopy[] {
  return Object.values(c.tabs);
}

/** Every string a reader can see, flattened, for one locale. */
function prose(locale: Locale): string[] {
  const { learner, centers } = docsCopy(locale);
  const points = (p?: readonly DocPoint[]) => (p ?? []).flatMap((x) => [x.title, x.body]);
  return [
    ...Object.values(learner.meta),
    ...Object.values(learner.head),
    ...learner.overview,
    ...points(learner.features),
    learner.callout.body,
    ...learner.steps.flatMap((s) => [s.title, s.body]),
    ...tabsOf(learner).flatMap((t) => [t.lede, t.how ?? "", ...points(t.points)]),
    ...Object.values(learner.cross),
    ...Object.values(centers.meta),
    ...Object.values(centers.head),
    ...centers.intro,
    ...points(centers.roles),
    ...centers.steps.flatMap((s) => [s.title, s.body]),
    ...tabsOf(centers).flatMap((t) => [t.lede, t.how ?? "", ...points(t.points)]),
    ...Object.values(centers.cross),
  ].filter(Boolean);
}

describe("the documentation copy is really translated", () => {
  it.each(LOCALES.filter((l) => l !== "en"))(
    "leaves no long English paragraph sitting in %s",
    (locale) => {
      const english = new Set(prose("en").filter((s) => s.length >= LONG));
      const untranslated = prose(locale).filter((s) => s.length >= LONG && english.has(s));
      expect(
        untranslated.map((s) => s.slice(0, 70) + "…"),
        `these are still the English text in ${locale}`,
      ).toEqual([]);
    },
  );

  it.each(LOCALES)("has no empty or placeholder string in %s", (locale) => {
    const blank = prose(locale).filter((s) => s.trim().length === 0 || /^(TODO|TBD)/i.test(s));
    expect(blank).toEqual([]);
  });

  it.each(LOCALES)("gives every tab a lede, and every non-overview tab its bullets in %s", (locale) => {
    const { learner, centers } = docsCopy(locale);
    for (const [name, guide] of [
      ["learner", learner],
      ["centers", centers],
    ] as const) {
      for (const [key, tab] of Object.entries(guide.tabs)) {
        expect(tab.title.trim(), `${name}.${key} has no title in ${locale}`).not.toBe("");
        expect(tab.lede.trim(), `${name}.${key} has no lede in ${locale}`).not.toBe("");
        // Overview renders a panel instead of bullets; every other tab needs them.
        if (key !== "overview") {
          expect(tab.points?.length ?? 0, `${name}.${key} has no points in ${locale}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps Uzbek on the modifier-letter apostrophe", () => {
    /* The rest of the Uzbek product uses ʻ (U+02BB) for oʻ and gʻ. A plain
       ASCII apostrophe renders as a different glyph beside it and sorts
       differently — and it is what every keyboard produces by default, so it
       arrives without anyone deciding to type it. */
    const wrong = prose("uz").filter((s) => /[a-z]'[a-z]/i.test(s));
    expect(wrong.map((s) => s.slice(0, 70) + "…"), "use ʻ (U+02BB), not '").toEqual([]);
  });
});

describe("the guides keep the reader in their own language", () => {
  /* ⚠️ THE BUG THIS EXISTS FOR. Each guide links to the other one twice — in
     the tab rail and in the footer band. A bare "/how-to-use/education-centers"
     there is silently wrong: it compiles, it renders, and it drops a Russian
     reader back onto the Uzbek page one click later. Nobody catches that in
     review because the link looks right. */
  it.each([
    ["learner-guide.tsx", learnerGuide],
    ["centers-guide.tsx", centersGuide],
  ])("builds every cross-link in %s through localePath", (_name, src) => {
    const hrefs = [...src.matchAll(/href[=:]\s*\{?([^,\n}]+)/g)].map((m) => m[1].trim());
    const bare = hrefs.filter((h) => /^["'`]\//.test(h));
    expect(bare, "a hardcoded path here drops the reader back to the default locale").toEqual([]);
    expect(src).toContain("localePath(");
  });

  it("pins the locale on the provider rather than seeding it", () => {
    /* `initial` reads the cookie after hydration: /ru/how-to-use would render
       Russian and then put an Uzbek header on it. Same trap the landing page
       hit and documents. */
    for (const src of [learnerGuide, centersGuide]) {
      expect(src).toMatch(/<LocaleProvider pin=\{locale\}>/);
      expect(src).not.toMatch(/<LocaleProvider initial=/);
    }
  });
});
