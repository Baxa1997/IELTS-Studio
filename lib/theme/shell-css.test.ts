import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE SHELL'S STYLESHEET MAY NOT NAME A COLOUR.
 *
 * ⚠️ THIS IS THE HALF OF DARK MODE THAT NOTHING ELSE WATCHES. The components
 * were converted to tokens and `contrast.test.ts` checks the pairs they render
 * — but the rail and the shared kit keep the states an inline style cannot
 * express (`:hover`, `:focus-visible`, the collapsed strip) in globals.css, and
 * a literal there is invisible to every other guard in the suite. Four shipped
 * that way and each one was the same shape — a value that is correct in light
 * and unconditional:
 *
 *   .lp-plan-btn            background: #fff      a white tile on a dark rail,
 *                                                 near-white ink on top of it
 *   .lp-nav-spin            #4b5359 on rgba(…)    the click feedback, invisible
 *   .lp-sb-badge            border: 1.5px #fff    a bright halo on a dark rail
 *   .ui-modal-x:hover       #f1f0eb / #16162e     a light chip, dark ink in it
 *
 * The fix is always to reach for the variable the surface already has — the
 * rail's `--sh-rail-*`, the palette's `--tk-*` — so the rule follows the theme
 * instead of describing one of them.
 *
 * Scoped to the shell and the shared kit on purpose. The lesson prose, the CRM
 * console and the exam runners are full of literals too; whether those surfaces
 * should invert at all is a design decision nobody has taken, and widening this
 * to the whole file would bury the signal under it.
 */

const ROOT = process.cwd();

/** The families this covers: the sidebar, the plan button, the shell frame and
 *  the `components/ui/*` kit (`.ui-`). */
const FAMILY = /\.(lp-sb-|lp-plan-|lp-shell-|lp-nav-spin|ui-)/;

/** Declarations that carry a colour. `box-shadow` is deliberately out: a shadow
 *  on a dark ground is a separate (and much softer) problem, and `--tk-*` owns
 *  the two that matter. */
const COLOUR_PROP =
  /(?:^|[;{])\s*(--[a-z0-9-]+|color|background|background-color|background-image|border[a-z-]*|outline[a-z-]*|fill|stroke)\s*:\s*([^;}]+)/gi;

const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;

/**
 * The two tiles in the rail's AI rows, and the white ink on them.
 *
 * These are SATURATED BRAND TILES, not surfaces — the same standing exception
 * the palette makes for the logomark: a filled violet/amber chip with white on
 * it reads the same on warm paper and on a near-black rail, so it does not
 * invert and is not drift.
 */
const ALLOWED = /\.lp-sb-airow/;

function rules(): { selector: string; body: string }[] {
  const css = readFileSync(join(ROOT, "app/globals.css"), "utf8")
    // Comments first — this file documents several of the literals it no longer
    // contains, and prose quoting `#fff` is not a rule setting it.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Paper has exactly one theme, and it is white. A print rule naming #fff is
    // the correct value, not a frozen one.
    .replace(/@media\s+print\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");

  const out: { selector: string; body: string }[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim().split("\n").pop()!.trim();
    if (FAMILY.test(selector) && !ALLOWED.test(selector)) out.push({ selector, body: m[2] });
  }
  return out;
}

describe("the shell's stylesheet", () => {
  const found = rules();

  it("still finds the rules it is meant to be watching", () => {
    // Rename the rail's classes and this scan quietly matches nothing, leaving
    // a green test guarding an empty set.
    expect(found.length).toBeGreaterThan(60);
  });

  it("never names a colour a theme cannot change", () => {
    const offenders: string[] = [];
    for (const { selector, body } of found) {
      for (const d of body.matchAll(COLOUR_PROP)) {
        if (LITERAL.test(d[2])) offenders.push(`${selector} { ${d[1]}: ${d[2].trim()} }`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
