import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The two rules `app/globals.css` states, enforced.
 *
 * Both failures they guard against are SILENT — nothing throws, nothing logs,
 * the page just renders wrong for the half of readers on the other theme — so
 * neither is something a reviewer reliably catches by eye.
 */

const ROOT = process.cwd();
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");

/** The `:root` block that declares a given prefix, and the `.dark` one. */
function block(open: RegExp): string {
  const at = css.search(open);
  expect(at, `no block matching ${open}`).toBeGreaterThan(-1);
  const from = css.indexOf("{", at);
  return css.slice(from, css.indexOf("\n}", from));
}

/**
 * Token names declared in `text`, EXCLUDING pure aliases.
 *
 * A token whose value is itself a `var(...)` — `--pc-surface: var(--tk-panel)` —
 * needs no dark override: it inherits whatever the token it points at resolves
 * to. Requiring one would be wrong, and writing one would silently break the
 * link it exists to express.
 */
function names(text: string, prefix: string): string[] {
  return [...text.matchAll(new RegExp(`^\\s*(${prefix}[a-z0-9-]+):\\s*([^;]+);`, "gm"))]
    .filter((m) => !/^var\(/.test(m[2].trim()))
    .map((m) => m[1]);
}


/** `--var: #hex` for one theme, from every matching block. */
function vars(theme: "light" | "dark"): Record<string, string> {
  const selector = theme === "light" ? ":root" : ".dark";
  const out: Record<string, string> = {};
  for (const b of css.matchAll(/(^|\n)(:root|\.dark)\s*\{([^}]*)\}/g)) {
    if (b[2] !== selector) continue;
    for (const m of b[3].matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/gm)) {
      if (!(m[1] in out)) out[m[1]] = m[2].toLowerCase();
    }
  }
  return out;
}

/** Relative luminance, per WCAG 2.x. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i] * c, 0);
}

/** Contrast ratio, per WCAG 2.x. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the runtime palette", () => {
  for (const [label, prefix] of [
    ["--tk-", "--tk-"],
    ["--mk-", "--mk-"],
    ["--sh-", "--sh-"],
    ["--pc-", "--pc-"],
  ] as const) {
    it(`defines every ${label} token in BOTH light and dark`, () => {
      // A token declared only in `:root` keeps its LIGHT value on a dark page.
      // That is how you get black text on a black card, and it looks like a
      // missing style rather than a missing line in a CSS block.
      const light = new Set(names(block(new RegExp(`:root \\{[^}]*\\${prefix}`)), prefix));
      const dark = new Set(names(block(new RegExp(`\\.dark \\{[^}]*\\${prefix}`)), prefix));

      expect(light.size, `no ${label} tokens found at all`).toBeGreaterThan(5);
      expect([...light].filter((n) => !dark.has(n))).toEqual([]);
      // And nothing may exist ONLY in dark: that renders as an invalid value in
      // light mode, which the browser drops without a word.
      expect([...dark].filter((n) => !light.has(n))).toEqual([]);
    });
  }

  /* ── the pairings the brand split exists to protect ───────────────────────
   *
   * Dark mode's brand is ORANGE, and a mid orange cannot do two jobs at once:
   * light enough to be AA-legible as small text on a dark card, and dark enough
   * to carry white text as a button fill. That is the entire reason `BRAND` and
   * `BRAND_FILL` are separate tokens, and why the hero panels have their own
   * three stops rather than reusing the brand ramp.
   *
   * ⚠️ WITHOUT THIS TEST THE SPLIT SILENTLY UNDOES ITSELF. Nothing about
   * `--tk-brand-fill: <same as brand>` looks wrong in a diff, and in LIGHT it
   * is genuinely correct — the two are the same colour there. The failure only
   * exists in dark, only on text nobody re-measures, and the reviewer who
   * "tidied up a duplicate token" will have been looking at the light block. */
  const AA = 4.5;

  it.each([
    ["--tk-brand-fill", "white text on the primary button", "#ffffff"],
    ["--tk-hero-c", "white body copy on the hero's lightest stop", "#ffffff"],
    ["--mk-brand-fill", "white text on a marketing button", "#ffffff"],
    ["--mk-hero-b", "white copy on the landing hero's lightest stop", "#ffffff"],
  ])("keeps %s legible in dark — %s", (token, _label, against) => {
    const dark = vars("dark");
    const hex = dark[token];
    expect(hex, `${token} has no dark value`).toBeTruthy();
    expect(contrast(hex, against), `${token} (${hex}) vs ${against}`).toBeGreaterThanOrEqual(AA);
  });

  it.each([
    ["--tk-panel", "the card it sits on"],
    ["--tk-brand-soft", "its own tint"],
  ])("keeps the dark brand legible as TEXT on %s (%s)", (ground) => {
    const dark = vars("dark");
    expect(contrast(dark["--tk-brand"], dark[ground]), `--tk-brand on ${ground}`).toBeGreaterThanOrEqual(AA);
  });

  it("keeps BRAND and BRAND_FILL identical in light and different in dark", () => {
    // Identical in light is not laziness — #7D0132 is dark enough to do both
    // jobs (10.9:1 against white). Orange is not, which is what forces them
    // apart. If they ever match in dark, the split has been undone.
    expect(vars("light")["--tk-brand-fill"]).toBe(vars("light")["--tk-brand"]);
    expect(vars("dark")["--tk-brand-fill"]).not.toBe(vars("dark")["--tk-brand"]);
  });

  for (const source of ["lib/theme/tokens.ts", "app/_landing/design.ts"]) {
    it(`${source} exports no colour literal except WHITE`, () => {
      // A hex here is baked at build time and cannot follow the theme. WHITE is
      // the single deliberate exception — it is the ink on a filled accent and
      // must stay white on both themes; every surface uses PANEL instead.
      const src = readFileSync(join(ROOT, source), "utf8");
      const literals = [...src.matchAll(/export const ([A-Z_0-9]+) = "(#[0-9a-fA-F]{3,8})";/g)];
      expect(literals.map((m) => m[1])).toEqual(["WHITE"]);
    });

    it(`${source} resolves every token to a variable that exists`, () => {
      const src = readFileSync(join(ROOT, source), "utf8");
      const used = [...src.matchAll(/export const [A-Z_0-9]+ = "var\((--[a-z0-9-]+)\)";/g)].map(
        (m) => m[1],
      );
      expect(used.length).toBeGreaterThan(10);
      for (const v of used) {
        expect(css, `${v} is exported but never declared in globals.css`).toMatch(
          new RegExp(`^\\s*\\${v}:`, "m"),
        );
      }
    });
  }
});
