/**
 * THE PLATFORM PAGE (2026-11-23) — three URLs that five files must agree on,
 * copy in three languages that must keep the same shape, and a page whose
 * whole job is to state facts an answer engine will repeat. So this pins:
 *
 *  - the five registrations, as cefr-page.test.ts does for the CEFR page;
 *  - that every price and contact detail is READ, never typed — the page went
 *    up the week a pricing change was still under discussion;
 *  - that no draft placeholder ("[TO FILL]") reaches the page — the brief it
 *    was written from had a dozen of them;
 *  - the brief's own limits: a title of ≤ 60 characters, a description of
 *    ≤ 155, and the brand not doubled by the root layout's suffix.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PLAN_ORDER, planTier } from "@/lib/billing/plans";
import { parseInline } from "@/lib/blog/inline";
import { CONTACT_PHONE, INSTAGRAM_URL, TELEGRAM_URL } from "@/lib/contact";
import { freePracticePage } from "@/lib/free-practice/links";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { HTML_LANG, LOCALES, localePath, SOURCE_LOCALE, type Locale } from "@/lib/i18n/locales";
import { PUBLIC_ROUTES } from "@/lib/seo";

import { platformPageMetadata } from "./_components/platform-page";
import { platformPageCopy, type PlatformPageCopy } from "./_lib/copy";

const PATH = "/ielts-ai-platform-uzbekistan";
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const middleware = read("../../../lib/supabase/middleware.ts");
const sitemap = read("../../sitemap.ts");
const provider = read("../../../shared/components/i18n/locale-provider.tsx");
const localisedSet = (src: string) => {
  const m = /LOCALISED(?:_ROUTES)?\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(src);
  return new Set([...(m?.[1] ?? "").replace(/\/\/.*$/gm, "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
};
/** A copy file's source without its comments — a comment may quote a price. */
const copySource = (l: Locale) =>
  read(`./_lib/copy/${l}.ts`)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const OTHERS = LOCALES.filter((l) => l !== SOURCE_LOCALE);
const PREFIX = new RegExp(`^/(${OTHERS.join("|")})(?=/)`);

/** A section's text — its heading, paragraphs, list items and table cells. */
const sectionText = (s: PlatformPageCopy["sections"][number]) => [
  s.title,
  ...s.blocks.flatMap((b) => (b.kind === "ul" ? b.items : b.kind === "table" ? [...b.head, ...b.rows.flat()] : [b.text])),
];

/** Every string a reader sees, in page order. */
function prose(c: PlatformPageCopy): string[] {
  return [
    c.meta.title,
    c.meta.description,
    c.meta.ogAlt,
    c.title,
    c.lead,
    ...c.sections.flatMap(sectionText),
    ...c.faq.flatMap((f) => [f.q, f.a]),
    c.cta.title,
    c.cta.sub,
  ];
}

const hrefs = (text: string) => parseInline(text).flatMap((s) => (s.kind === "link" ? [s.href] : []));

/** The link targets of each section, in order. */
const links = (c: PlatformPageCopy) => c.sections.map((s) => sectionText(s).flatMap(hrefs));

/** The shape of each section: block kinds, list lengths, table sizes. */
const shape = (c: PlatformPageCopy) =>
  c.sections.map((s) =>
    s.blocks.map((b) =>
      b.kind === "ul" ? `ul${b.items.length}` : b.kind === "table" ? `table${b.head.length}x${b.rows.length}` : b.kind,
    ),
  );

describe("the platform page's three URLs", () => {
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

  it("declare each other with hreflang, and send an unmatched visitor to English", () => {
    for (const locale of LOCALES) {
      const alt = platformPageMetadata(locale).alternates!;
      expect(alt.canonical, locale).toBe(localePath(PATH, locale));
      const languages = alt.languages as Record<string, string>;
      for (const l of LOCALES) expect(languages[HTML_LANG[l]], `${locale} → ${l}`).toBe(localePath(PATH, l));
      expect(languages["x-default"]).toBe(localePath(PATH, SOURCE_LOCALE));
    }
  });
});

describe.each(LOCALES)("the %s page's meta", (locale) => {
  const c = platformPageCopy(locale);

  it("keeps the title whole — the brand is already in it, so the layout's suffix is not added", () => {
    expect(platformPageMetadata(locale).title).toEqual({ absolute: c.meta.title });
    expect(c.meta.title.startsWith("EngProgress")).toBe(true);
  });

  it("fits a search result: title ≤ 60 characters, description ≤ 155", () => {
    expect([...c.meta.title].length, c.meta.title).toBeLessThanOrEqual(60);
    expect([...c.meta.description].length, c.meta.description).toBeLessThanOrEqual(155);
  });
});

describe("the platform page's copy", () => {
  const source = platformPageCopy(SOURCE_LOCALE);

  it.each(OTHERS)("%s keeps every section, block, table and question", (locale) => {
    const c = platformPageCopy(locale);
    expect(shape(c)).toEqual(shape(source));
    expect(c.faq.length).toBe(source.faq.length);
  });

  it.each(OTHERS)("%s keeps every link, in the same place — localised where a localised page exists", (locale) => {
    const c = platformPageCopy(locale);
    expect(links(c).map((s) => s.map((h) => h.replace(PREFIX, "")))).toEqual(links(source));
    const localised = localisedSet(sitemap);
    for (const h of links(c).flat()) {
      const bare = h.replace(PREFIX, "");
      if (h.startsWith("/") && !PREFIX.test(h)) {
        // An English-only link where this language's page exists sends the reader out of their language.
        expect(localised.has(bare), `${locale} links to ${h}; use /${locale}${bare}`).toBe(false);
      }
    }
  });

  it.each(LOCALES)("%s links only to pages a signed-out visitor can open", (locale) => {
    const publicPaths = new Set(PUBLIC_ROUTES.map((r) => r.path as string));
    const localised = localisedSet(sitemap);
    for (const h of links(platformPageCopy(locale)).flat()) {
      if (!h.startsWith("/")) {
        expect(h, "an outside link is a phone, WhatsApp or a social profile").toMatch(/^(tel:|https:\/\/)/);
        continue;
      }
      const bare = h.replace(PREFIX, "");
      expect(publicPaths.has(bare), `${h} is not a public route — it would bounce to /sign-in`).toBe(true);
      if (PREFIX.test(h)) expect(localised.has(bare), `${h} has no /${locale} version`).toBe(true);
    }
  });

  it.each(LOCALES)("%s offers exactly the free daily practices that exist", (locale) => {
    const practice = links(platformPageCopy(locale))
      .flat()
      .map((h) => h.replace(PREFIX, ""))
      .filter((h) => h.startsWith("/practice/"));
    expect(practice.sort()).toEqual(FREE_SKILLS.map(freePracticePage).sort());
  });

  it.each(LOCALES)("%s has no markup left over, none in the FAQ, and no draft placeholder", (locale) => {
    const c = platformPageCopy(locale);
    for (const text of prose(c)) {
      const rendered = parseInline(text).map((s) => s.text).join("");
      expect(rendered, `stray markup in ${locale}: ${text.slice(0, 60)}`).not.toMatch(/\*\*|\]\(/);
      // The brief marked every fact the site could not back with [TO FILL].
      expect(text, `draft placeholder in ${locale}`).not.toMatch(/TO FILL|\[TODO|\[\s*\]|XXX/i);
    }
    // The FAQ is also the FAQPage JSON-LD, which must be plain text.
    for (const f of c.faq) expect(`${f.q} ${f.a}`, locale).not.toMatch(/\*\*|\]\(/);
  });

  it("keeps Uzbek on the modifier-letter apostrophe", () => {
    const wrong = prose(platformPageCopy("uz")).filter((s) => /[a-z]['‘’][a-z]/i.test(s));
    expect(wrong.map((s) => s.slice(0, 70) + "…")).toEqual([]);
  });
});

describe("the facts on the page", () => {
  it.each(LOCALES)("%s types no price and no contact detail — it reads them", (locale) => {
    const src = copySource(locale);
    // `$${…}` is a template reading a price; `$5.99` would be one typed in.
    expect(src.match(/\$\d[\d.,]*/g) ?? [], "a price typed by hand").toEqual([]);
    for (const literal of [CONTACT_PHONE, TELEGRAM_URL, INSTAGRAM_URL]) expect(src).not.toContain(literal);
  });

  it.each(LOCALES)("%s shows every plan at its real price, and the lowest monthly one in the lead", (locale) => {
    const c = platformPageCopy(locale);
    const tiers = PLAN_ORDER.map(planTier);
    const plans = c.sections.flatMap((s) => s.blocks).find((b) => b.kind === "table" && b.rows.length === tiers.length);
    expect(plans, "the plan table").toBeDefined();
    if (plans?.kind !== "table") return;
    expect(plans.rows.map((r) => r[0])).toEqual(tiers.map((t) => t.name));
    tiers.forEach((t, i) => expect(plans.rows[i][1], t.name).toContain(`$${t.price}`));
    const cheapest = Math.min(...tiers.filter((t) => t.months === 1 && (t.price ?? 0) > 0).map((t) => t.price ?? 0));
    expect(c.lead).toContain(`$${cheapest}`);
  });

  it.each(LOCALES)("%s gives the contact details lib/contact.ts holds", (locale) => {
    const all = prose(platformPageCopy(locale)).join("\n");
    for (const literal of [CONTACT_PHONE, TELEGRAM_URL, INSTAGRAM_URL]) expect(all).toContain(literal);
  });
});
