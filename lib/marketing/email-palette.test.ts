/**
 * The email's hex colours are the LIGHT column of the site's tokens — copied,
 * because a mail client cannot resolve a `var()`. A copy drifts silently, so
 * this reads `app/globals.css` and compares, as app/_landing/_lib/og-palette.test.ts
 * does for the share card.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EMAIL_PALETTE } from "./email-html";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** Every `--name: #hex` declared in a `:root { … }` block. */
const light: Record<string, string> = {};
for (const b of css.matchAll(/(^|\n):root\s*\{([^}]*)\}/g)) {
  for (const m of b[2].matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6});/gm)) {
    light[m[1]] ??= m[2].toLowerCase();
  }
}

const SOURCE: Record<keyof typeof EMAIL_PALETTE, string> = {
  ink: "--tk-ink",
  body: "--tk-body",
  muted: "--tk-muted",
  rule: "--tk-rule",
  card: "--tk-panel",
  page: "--tk-page-grad-bottom",
  brand: "--tk-brand",
  brandFill: "--tk-brand-fill",
};

describe("the email's colours", () => {
  it.each(Object.entries(SOURCE))("%s matches the light token", (key, token) => {
    expect(light[token], `${token} not found in globals.css`).toBeTruthy();
    expect(EMAIL_PALETTE[key as keyof typeof EMAIL_PALETTE]).toBe(light[token]);
  });
});
