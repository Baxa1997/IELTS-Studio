/**
 * /grade AND /practice/cefr IN THREE LANGUAGES (owner, 2026-11-08). Each is
 * public only if five files agree — PUBLIC_ROUTES, the middleware, both
 * LOCALISED sets, and a `[locale]` route pinned with `dynamicParams = false` —
 * and the practice's list of localised skills lives in a third place the two
 * sets cannot import. Nothing in the type system joins them, so this does.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { freePracticePage } from "@/lib/free-practice/links";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE } from "@/lib/i18n/locales";
import { PUBLIC_ROUTES } from "@/lib/seo";

import { LOCALISED_PRACTICE } from "../practice/[skill]/_lib/locales";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const middleware = read("../../lib/supabase/middleware.ts");
const sitemap = read("../sitemap.ts");
const provider = read("../../shared/components/i18n/locale-provider.tsx");
const localisedSet = (src: string) => {
  const m = /LOCALISED(?:_ROUTES)?\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(src);
  return new Set([...(m?.[1] ?? "").replace(/\/\/.*$/gm, "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
};

const PAGES = ["/grade", ...LOCALISED_PRACTICE.map(freePracticePage)];

describe.each(PAGES)("%s", (path) => {
  it("is a public route, so the sitemap, llms.txt and robots list it", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path as string)).toContain(path);
  });

  it("is localised in the sitemap AND in the language picker", () => {
    expect(localisedSet(sitemap).has(path), "sitemap LOCALISED").toBe(true);
    expect(localisedSet(provider).has(path), "picker LOCALISED_ROUTES").toBe(true);
  });
});

describe("the localised routes", () => {
  it("404 an unknown language — and, for practice, a skill not yet localised", () => {
    for (const route of ["./grade/page.tsx", "./practice/[skill]/page.tsx"]) {
      const src = read(route);
      expect(src, route).toMatch(/export const dynamicParams = false/);
      expect(src, route).toMatch(/generateStaticParams/);
    }
    expect(read("./practice/[skill]/page.tsx")).toContain("LOCALISED_PRACTICE.includes(skill)");
  });

  it("are public to a signed-out visitor under the language prefixes", () => {
    for (const l of LOCALES.filter((x) => x !== SOURCE_LOCALE)) expect(middleware).toContain(`"/${l}"`);
  });

  it("claim exactly the practice pages that exist in three languages, no more", () => {
    // A /uz/practice/reading in the sitemap would be a URL that 404s.
    const practiceIn = (set: Set<string>) => [...set].filter((p) => p.startsWith("/practice/")).sort();
    const expected = LOCALISED_PRACTICE.map(freePracticePage).sort();
    expect(practiceIn(localisedSet(sitemap))).toEqual(expected);
    expect(practiceIn(localisedSet(provider))).toEqual(expected);
  });
});

describe("hreflang", () => {
  it("/grade names all three languages and sends the rest to English", async () => {
    const { gradeMetadata } = await import("../grade/_components/grade-page");
    for (const locale of LOCALES) {
      const alt = gradeMetadata(locale).alternates!;
      expect(alt.canonical, locale).toBe(localePath("/grade", locale));
      const languages = alt.languages as Record<string, string>;
      for (const l of LOCALES) expect(languages[HTML_LANG[l]]).toBe(localePath("/grade", l));
      expect(languages["x-default"]).toBe("/grade");
    }
  });

  it("only a practice page that exists in three languages declares them", async () => {
    const { practiceMetadata } = await import("../practice/[skill]/_components/practice-page");
    for (const skill of FREE_SKILLS) {
      const alt = practiceMetadata(skill, SOURCE_LOCALE).alternates!;
      const path = freePracticePage(skill);
      if (LOCALISED_PRACTICE.includes(skill)) {
        expect((alt.languages as Record<string, string>)[HTML_LANG.uz], skill).toBe(localePath(path, "uz"));
      } else {
        expect(alt.languages, `${skill} would point hreflang at a 404`).toBeUndefined();
      }
    }
  });
});
