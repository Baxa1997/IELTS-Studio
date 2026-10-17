/**
 * THE TWO CALCULATORS ARE SIX URLS, AND FIVE FILES HAVE TO KNOW ABOUT THEM.
 *
 * A public page here is not public until it is in PUBLIC_ROUTES (sitemap,
 * llms.txt, robots, the blog's link check), in the middleware's PUBLIC_PATHS
 * (or every crawler is 307ed to /sign-in), in both LOCALISED sets (or the
 * sitemap and the language picker disagree about /uz and /ru), and has its
 * `[locale]` route pinned with `dynamicParams = false`. Nothing in the type
 * system joins those up, so this does.
 *
 * And the copy: a translation that drops a `{slot}` from a template does not
 * fail to compile — the number it was meant to show just disappears.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LOCALES } from "@/lib/i18n/locales";
import { PUBLIC_ROUTES } from "@/lib/seo";

import { en } from "./_lib/copy/en";
import { ru } from "./_lib/copy/ru";
import { uz } from "./_lib/copy/uz";
import { IELTS_CALCULATOR_PATH, MULTILEVEL_CALCULATOR_PATH, PHOTOS } from "./_lib/page-meta";
import { TOOL_CSS } from "./_lib/tool-css";

const PATHS = [IELTS_CALCULATOR_PATH, MULTILEVEL_CALCULATOR_PATH];
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const middleware = read("../../lib/supabase/middleware.ts");
const sitemap = read("../sitemap.ts");
const provider = read("../../shared/components/i18n/locale-provider.tsx");

const localisedSet = (src: string) => {
  const m = /LOCALISED(?:_ROUTES)?\s*=\s*new Set\(\[([^\]]*)\]\)/.exec(src);
  return new Set([...(m?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]));
};

describe.each(PATHS)("%s", (path) => {
  it("is a public route, so the sitemap, llms.txt and robots list it", () => {
    expect(PUBLIC_ROUTES.map((r) => r.path as string)).toContain(path);
  });

  it("is public to a signed-out visitor and to a crawler", () => {
    expect(middleware, `${path} is not in PUBLIC_PATHS`).toContain(`"${path}"`);
  });

  it("is localised in the sitemap AND in the language picker", () => {
    expect(localisedSet(sitemap).has(path), "sitemap LOCALISED").toBe(true);
    expect(localisedSet(provider).has(path), "picker LOCALISED_ROUTES").toBe(true);
  });

  it("has a localised route that 404s an unknown language", () => {
    const route = read(`../[locale]${path}/page.tsx`);
    expect(route).toMatch(/export const dynamicParams = false/);
    expect(route).toMatch(/generateStaticParams/);
  });
});

describe("the photos", () => {
  /** Width and height from a baseline or progressive JPEG's frame header. */
  function jpegSize(file: string): [number, number] {
    const b = readFileSync(file);
    for (let i = 2; i < b.length - 9; ) {
      if (b[i] !== 0xff) return [0, 0];
      const marker = b[i + 1];
      if (marker === 0xc0 || marker === 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
    return [0, 0];
  }

  it.each(Object.entries(PHOTOS))("%s is in /public at the size the share card claims", (_, photo) => {
    const file = join(process.cwd(), "public", photo.src);
    expect(existsSync(file), photo.src).toBe(true);
    expect(jpegSize(file)).toEqual([photo.width, photo.height]);
  });
});

describe("the copy", () => {
  /** Every string in a copy object, by its path. */
  function leaves(node: unknown, path = ""): Map<string, string> {
    const out = new Map<string, string>();
    if (typeof node === "string") out.set(path, node);
    else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) for (const [p, s] of leaves(v, `${path}.${k}`)) out.set(p, s);
    }
    return out;
  }
  const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  // Search keywords are per language — what people type in Uzbek is not a
  // translation of what they type in English — so they are not compared.
  const translatable = (copy: unknown) => new Map([...leaves(copy)].filter(([p]) => !p.includes(".meta.keywords.")));
  const source = translatable(en);

  it.each(Object.entries({ uz, ru }))("%s has every string English has, none empty, with the same {slots}", (_, copy) => {
    const translated = translatable(copy);
    expect([...translated.keys()].sort()).toEqual([...source.keys()].sort());
    for (const [path, text] of source) {
      const other = translated.get(path) ?? "";
      expect(other.trim(), `${path} is empty`).not.toBe("");
      expect(slots(other), `${path} lost or gained a slot`).toEqual(slots(text));
    }
  });

  it("covers every locale the site has", () => {
    expect(Object.keys({ en, uz, ru }).sort()).toEqual([...LOCALES].sort());
  });
});

describe("the stylesheet", () => {
  it("caps every grid track, so nothing is wider than a phone", () => {
    // The same rule app/_landing/responsive.test.ts holds the public pages to.
    const tracks = [...TOOL_CSS.matchAll(/minmax\(\s*(min\()?\s*(\d+)px/g)];
    expect(tracks.length).toBeGreaterThan(0);
    for (const t of tracks) expect(Boolean(t[1]), `${t[0]} can overflow`).toBe(true);
  });
});
