/**
 * A PAGE GOOGLE KNOWS ABOUT NEVER JUST VANISHES.
 *
 * Search Console's "Not found (404)" report is fed by URLs that used to be in
 * the sitemap. Each deleted public page either REDIRECTS, permanently, to the
 * page that does its job now — or 404s on purpose (GONE_PATHS in the
 * middleware) because nothing does. What it must not do is fall through to the
 * middleware's default, a 307 to /sign-in, which Google reads as a soft-404.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PUBLIC_ROUTES } from "@/lib/seo";
import nextConfig, { RETIRED_PAGE_REDIRECTS } from "@/next.config";

const PUBLIC = PUBLIC_ROUTES.map((r) => r.path as string);
const middleware = readFileSync(fileURLToPath(new URL("../lib/supabase/middleware.ts", import.meta.url)), "utf8");
const gone = JSON.parse(middleware.match(/const GONE_PATHS = (\[[^\]]*\])/)![1]) as string[];

describe("retired public pages", () => {
  it("send the old sign-up page and the Cambridge page on, not to a 404", () => {
    const sources = RETIRED_PAGE_REDIRECTS.map((r) => r.source);
    expect(sources).toContain("/sign-up");
    expect(sources).toContain("/cambridge-ielts-practice");
  });

  it("are live redirects, and permanent", async () => {
    const live = await nextConfig.redirects!();
    for (const r of RETIRED_PAGE_REDIRECTS) {
      expect(r.permanent, r.source).toBe(true);
      expect(live).toContainEqual(r);
    }
  });

  it("land on a page that is itself public — never a second dead end", () => {
    for (const r of RETIRED_PAGE_REDIRECTS) expect(PUBLIC, `${r.source} → ${r.destination}`).toContain(r.destination);
  });

  it("are retired for real: no live public route, no deliberate 404 shadowing the redirect", () => {
    for (const r of RETIRED_PAGE_REDIRECTS) {
      expect(PUBLIC, r.source).not.toContain(r.source);
      expect(gone.some((g) => r.source === g || r.source.startsWith(`${g}/`)), r.source).toBe(false);
    }
  });
});
