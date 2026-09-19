import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * `${COLOUR}33` IS NOT A COLOUR ANY MORE, AND IT FAILS IN SILENCE.
 *
 * Appending two hex digits to add alpha was valid for as long as every token
 * was a hex literal. The tokens are `var(--tk-…)` strings now, so the same
 * expression yields `"var(--tk-brand)33"` — not a colour, and not a parse error
 * either. The browser DROPS the declaration and you get an element with no
 * border, no glow and nothing in the console to explain it. Worse, a dropped
 * `border` shorthand takes the width with it: `border-style` falls back to
 * `none`, so the width computes to zero and even a separate `border-top-color`
 * draws nothing.
 *
 * ⚠️ SEVENTEEN SITES WERE ALREADY DEAD WHEN THIS WAS WRITTEN, across Speaking
 * (every persona chip, its glow and the tutor's backdrop), the landing demo,
 * the writing feedback's annotation chips, the marketing footer link and the
 * shared `Spinner`, which drew nothing at all. None of them threw. The palette
 * module had documented the trap; documentation is not a guard.
 *
 * `withAlpha(colour, pct)` is the one safe form — `color-mix` resolves the var
 * first and then mixes, so it works on a token, a hex, or a caller's arbitrary
 * string. The percentages: 1F→12, 33→20, 40→25, 4D→30, 55→33, 66→40.
 *
 * The rule is a FLAT BAN rather than "banned when it resolves to a var",
 * because whether a given site works depends on a value declared in another
 * file that can be tokenised at any time — which is precisely how all seventeen
 * broke at once. A pattern whose correctness is someone else's edit away is not
 * worth keeping for the four characters it saves.
 */

const ROOT = process.cwd();

/**
 * The two shapes it takes.
 *
 * The template one is anchored on its CLOSING BACKTICK, so a real string like
 * `${n}40px` is not caught. The plain one needs no anchor: a `var()` with two
 * hex digits stuck to it is never anything else, and it is the shape the
 * template scan misses — `blobB: "var(--color-amber-500)33"` in the tutor room
 * was found by grepping for it after the template sweep came back clean.
 */
const SHAPES = [/\$\{[^}]+\}[0-9a-fA-F]{2}`/g, /var\(--[a-z0-9-]+\)[0-9a-fA-F]{2}/g];

describe("alpha by hex suffix", () => {
  const files = execFileSync("git", ["ls-files", "app", "components", "lib"], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f));

  it("scans the files it is meant to", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it("never appears — use withAlpha", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(join(ROOT, file), "utf8")
        // The trap is documented in prose in three places, this file included;
        // a comment quoting the broken form is not the broken form.
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      src.split("\n").forEach((line, i) => {
        // The MATCH, not the head of the line: these are single-line JSX style
        // objects and the offending twelve characters are usually 200 columns in.
        for (const shape of SHAPES) {
          for (const m of line.matchAll(shape)) {
            offenders.push(`${file}:${i + 1}  …${m[0]} — use withAlpha()`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
