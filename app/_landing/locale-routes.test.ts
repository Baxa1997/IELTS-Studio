import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";

/**
 * THE LANDING PAGE IS THREE URLS AND THEY HAVE TO AGREE.
 *
 * A cookie is invisible to a crawler — Googlebot sends no `ep-locale`, so a
 * cookie-only site has exactly one indexable version however many languages it
 * renders. That is why `/uz` and `/ru` exist as real routes. Four things then
 * have to stay in step, and nothing in the type system makes them:
 *
 *   · the route must be PUBLIC, or the middleware 307s crawlers to /sign-in and
 *     the hreflang promises a page that answers with a redirect;
 *   · the pages must declare each other with `hreflang`, or the three compete
 *     as near-duplicates;
 *   · the sitemap must list what exists and NOT list what does not;
 *   · the picker's idea of which routes are localised must match the sitemap's,
 *     or it offers a URL that 404s.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const middleware = read("../../lib/supabase/middleware.ts");
const sitemap = read("../sitemap.ts");
const provider = read("../../shared/components/i18n/locale-provider.tsx");
const landing = read("./_components/landing-page.tsx");
const localised = read("../[locale]/page.tsx");

describe("the localised landing routes", () => {
  it("are public", () => {
    // Every locale but the default, which lives at "/" and is public already.
    for (const l of LOCALES.filter((x) => x !== DEFAULT_LOCALE)) {
      expect(middleware, `/${l} is not in PUBLIC_PATHS`).toContain(`"/${l}"`);
    }
  });

  it("cannot be reached by an unknown segment", () => {
    // Without this a single dynamic segment at the root answers 200 for any
    // one-word path that has no route of its own.
    expect(localised).toMatch(/export const dynamicParams = false/);
    expect(localised).toMatch(/generateStaticParams/);
  });

  it("declare each other with hreflang, and name an x-default", () => {
    expect(landing).toMatch(/alternates:\s*\{[\s\S]{0,400}languages:/);
    expect(landing).toContain('"x-default"');
  });

  it("keep the default language on the bare URL", () => {
    /* The one thing that must never quietly change: `/` is the indexed page and
       every backlink points at it. A canonical of `/uz` would 301 away the
       site's most valuable URL. WHICH language `/` answers in is a product
       decision and may move again — that it is the unprefixed one may not. */
    expect(landing).toMatch(/locale === DEFAULT_LOCALE \? "\/" : `\/\$\{locale\}`/);
  });

  it("send an unmatched language to English, not to the default", () => {
    /* `x-default` is for the searcher whose language is none of the three. That
       person is not an Uzbek speaker, so pointing it at `/` — which is now the
       Uzbek page — would hand every unmatched international visitor the
       local-market copy. It follows SOURCE_LOCALE instead. */
    expect(landing).toMatch(/"x-default":\s*SOURCE_LOCALE/);
  });

  it("let the picker derive the prefixes rather than spelling them out", () => {
    /* THE BUG THIS EXISTS FOR, because it was a live one: the switcher stripped
       a literal /^\/(uz|ru)/ from the path, which was correct only while
       English was the default. Moving the default to Uzbek did not break that
       expression, it made it silently wrong — `/en` stopped being recognised as
       a localised path and choosing another language from the English page did
       nothing at all. A derived list cannot go stale. */
    expect(provider).toContain("LOCALES.filter((l) => l !== DEFAULT_LOCALE)");
    // The literal form, matched as a plain string so the docstring that quotes
    // it as history does not trip this.
    expect(provider, "a locale is hardcoded into the prefix regex").not.toContain(
      ".replace(/^\\/(",
    );
  });

  it("agree with the picker about which routes are localised", () => {
    const set = (src: string) => {
      const m = /LOCALISED(?:_ROUTES)?\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(src);
      return new Set([...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
    };
    const fromSitemap = set(sitemap);
    const fromPicker = set(provider);
    expect(fromSitemap.size, "no localised routes found in the sitemap").toBeGreaterThan(0);
    expect([...fromPicker].sort()).toEqual([...fromSitemap].sort());
  });
});
