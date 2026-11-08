/**
 * THE CEFR PAGE IS THREE URLS, AND FIVE FILES HAVE TO KNOW ABOUT THEM — the
 * same five the calculators do (app/(tools)/tools-routes.test.ts): PUBLIC_ROUTES,
 * the middleware's PUBLIC_PATHS, both LOCALISED sets, and a `[locale]` route
 * pinned with `dynamicParams = false`. Nothing in the type system joins them.
 *
 * And the copy: a translation that drops a link compiles and renders — the
 * reader just loses the way to the page it pointed at.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseInline } from "@/lib/blog/inline";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE } from "@/lib/i18n/locales";
import { PUBLIC_ROUTES } from "@/lib/seo";

import { cefrPageCopy, type CefrPageCopy } from "./_lib/copy";

const PATH = "/cefr-multilevel-practice";
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const middleware = read("../../../lib/supabase/middleware.ts");
const sitemap = read("../../sitemap.ts");
const provider = read("../../../shared/components/i18n/locale-provider.tsx");
const localisedSet = (src: string) => {
  const m = /LOCALISED(?:_ROUTES)?\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(src);
  return new Set([...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
};

/** Every string a reader sees, in page order. */
function prose(c: CefrPageCopy): string[] {
  return [
    c.meta.title,
    c.meta.description,
    c.title,
    c.lead,
    ...c.sections.flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.bullets ?? [])]),
    ...c.faq.flatMap((f) => [f.q, f.a]),
    c.cta.title,
    c.cta.sub,
  ];
}

/** The link targets of each paragraph and bullet, section by section. */
const links = (c: CefrPageCopy) =>
  c.sections.map((s) =>
    [...(s.paragraphs ?? []), ...(s.bullets ?? [])].map((t) =>
      parseInline(t)
        .filter((x) => x.kind === "link")
        .map((x) => (x as { href: string }).href),
    ),
  );

describe("the CEFR page's three URLs", () => {
  it("are public routes, so the sitemap, llms.txt and robots list them", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path as string)).toContain(PATH);
    expect(middleware, `${PATH} is not in PUBLIC_PATHS`).toContain(`"${PATH}"`);
  });

  it("are localised in the sitemap AND in the language picker", () => {
    expect(localisedSet(sitemap).has(PATH), "sitemap LOCALISED").toBe(true);
    expect(localisedSet(provider).has(PATH), "picker LOCALISED_ROUTES").toBe(true);
  });

  it("have a localised route that 404s an unknown language", () => {
    const route = read(`../../[locale]${PATH}/page.tsx`);
    expect(route).toMatch(/export const dynamicParams = false/);
    expect(route).toMatch(/generateStaticParams/);
  });

  it("declare each other with hreflang, and send an unmatched visitor to English", async () => {
    const { cefrPracticeMetadata } = await import("./_components/cefr-page");
    for (const locale of LOCALES) {
      const alt = cefrPracticeMetadata(locale).alternates!;
      expect(alt.canonical, locale).toBe(localePath(PATH, locale));
      const languages = alt.languages as Record<string, string>;
      for (const l of LOCALES) expect(languages[HTML_LANG[l]], `${locale} → ${l}`).toBe(localePath(PATH, l));
      expect(languages["x-default"]).toBe(localePath(PATH, SOURCE_LOCALE));
    }
  });
});

describe("the CEFR page's copy", () => {
  const source = cefrPageCopy(SOURCE_LOCALE);

  it.each(LOCALES.filter((l) => l !== SOURCE_LOCALE))("%s keeps every section, paragraph and question", (locale) => {
    const c = cefrPageCopy(locale);
    expect(c.sections.map((s) => [s.paragraphs?.length ?? 0, s.bullets?.length ?? 0])).toEqual(
      source.sections.map((s) => [s.paragraphs?.length ?? 0, s.bullets?.length ?? 0]),
    );
    expect(c.faq.length).toBe(source.faq.length);
  });

  it.each(LOCALES.filter((l) => l !== SOURCE_LOCALE))("%s keeps every link, in the same place", (locale) => {
    expect(links(cefrPageCopy(locale))).toEqual(links(source));
  });

  it.each(LOCALES)("%s has no markup left over and none where it cannot render", (locale) => {
    const c = cefrPageCopy(locale);
    for (const text of prose(c)) {
      // An unmatched `**` renders as two literal asterisks.
      const rendered = parseInline(text).map((s) => s.text).join("");
      expect(rendered, `stray markup in ${locale}: ${text.slice(0, 60)}`).not.toMatch(/\*\*|\]\(/);
    }
    // The FAQ is also the FAQPage JSON-LD, which must be plain text.
    for (const f of c.faq) expect(`${f.q} ${f.a}`, locale).not.toMatch(/\*\*|\]\(/);
  });

  it("keeps Uzbek on the modifier-letter apostrophe", () => {
    // ʻ (U+02BB) for oʻ and gʻ, as the rest of the Uzbek product writes them —
    // the ASCII one is what every keyboard types by default.
    const wrong = prose(cefrPageCopy("uz")).filter((s) => /[a-z]['‘’][a-z]/i.test(s));
    expect(wrong.map((s) => s.slice(0, 70) + "…")).toEqual([]);
  });
});
