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

function names(text: string, prefix: string): string[] {
  return [...text.matchAll(new RegExp(`^\\s*(${prefix}[a-z0-9-]+):`, "gm"))].map((m) => m[1]);
}

describe("the runtime palette", () => {
  for (const [label, prefix] of [
    ["--tk-", "--tk-"],
    ["--mk-", "--mk-"],
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
