/**
 * The share card's hex colours are the LIGHT column of the cover and hero
 * tokens — copied, because a PNG drawn by `next/og` cannot resolve a `var()`.
 * A copy drifts silently, so this reads `app/globals.css` and compares.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OG_COVER } from "./og-palette";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** Every `--name: #hex` declared in a `:root { … }` block. */
const light: Record<string, string> = {};
for (const b of css.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
  for (const m of b[2].matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/gm)) {
    light[m[1]] ??= m[2].toLowerCase();
  }
}

const SOURCE: Record<keyof typeof OG_COVER, [string, string]> = {
  ielts: ["--mk-cover-ielts-a", "--mk-cover-ielts-b"],
  multilevel: ["--mk-cover-multilevel-a", "--mk-cover-multilevel-b"],
  english: ["--mk-cover-english-a", "--mk-cover-english-b"],
  stories: ["--mk-cover-stories-a", "--mk-cover-stories-b"],
  engprogress: ["--mk-hero-b", "--mk-hero-a"],
};

describe("the share card's colours", () => {
  it.each(Object.entries(SOURCE))("match the light tokens for %s", (cat, [a, b]) => {
    const card = OG_COVER[cat as keyof typeof OG_COVER];
    expect(light[a], `${a} not found in globals.css`).toBeTruthy();
    expect(card.a).toBe(light[a]);
    expect(card.b).toBe(light[b]);
  });
});
