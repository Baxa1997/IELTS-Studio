import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { LOCALES } from "@/lib/i18n/locales";

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
const provider = read("../../components/i18n/locale-provider.tsx");
const landing = read("./landing-page.tsx");
const localised = read("../[locale]/page.tsx");

describe("the localised landing routes", () => {
  it("are public", () => {
    for (const l of LOCALES.filter((x) => x !== "en")) {
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

  it("keep English on the bare URL", () => {
    /* The one thing that must never quietly change: `/` is the indexed page and
       every backlink points at it. A canonical of `/en` would 301 away the
       site's most valuable URL. */
    expect(landing).toMatch(/locale === DEFAULT_LOCALE \? "\/" : `\/\$\{locale\}`/);
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
