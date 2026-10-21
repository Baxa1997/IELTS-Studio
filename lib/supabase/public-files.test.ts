/**
 * EVERY FILE IN public/ MUST ANSWER A SIGNED-OUT REQUEST.
 *
 * The proxy runs on every path except images and a few SEO files, and sends
 * any path outside PUBLIC_PATHS to /sign-in. A static file it does not skip —
 * a search engine's ownership file like BingSiteAuth.xml, the next Google or
 * Yandex verification file — is then served to everyone EXCEPT the crawler it
 * exists for, which reads the sign-in page and refuses to verify the site.
 *
 * Derived from the folder, so the next such file fails here until it is
 * listed, instead of failing silently in a webmaster console.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const mw = readFileSync(join(root, "lib/supabase/middleware.ts"), "utf8");
const start = mw.indexOf("const PUBLIC_PATHS = [");
const publicPaths = mw.slice(start, mw.indexOf("];", start));

/** What proxy.ts's matcher already lets through without running the proxy. */
const SKIPPED = /\.(svg|png|jpg|jpeg|gif|webp)$/;

/** Every file under public/, as the URL path it is served at. */
function servedPaths(dir = "public", base = ""): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? servedPaths(join(dir, e.name), `${base}/${e.name}`) : [`${base}/${e.name}`],
  );
}

describe("files in public/", () => {
  it("are skipped by the proxy or listed as public paths", () => {
    const blocked = servedPaths()
      .filter((p) => !SKIPPED.test(p) && !["/favicon.ico", "/robots.txt", "/sitemap.xml"].includes(p))
      .filter((p) => !publicPaths.includes(`"${p}"`));
    expect(blocked).toEqual([]);
  });

  it("include Bing's ownership file, which is what this guard was written for", () => {
    expect(servedPaths()).toContain("/BingSiteAuth.xml");
  });
});
