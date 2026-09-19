import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * A SERVER MODULE MAY IMPORT A COMPONENT ACROSS THE CLIENT BOUNDARY. IT MAY NOT
 * IMPORT A VALUE.
 *
 * Everything a `"use client"` module exports reaches server code as a client
 * REFERENCE — a marker the bundler swaps in so React can ship the component to
 * the browser. For a component that is exactly right. For a string, an array or
 * a function the server means to CALL or read, it is junk, and it is junk that
 * does not throw: you get `[object Object]` interpolated into whatever you were
 * building.
 *
 * This file exists because that happened. `FOOTER_CSS` — the footer's grid and
 * its breakpoints — lived in `site-footer.tsx`, which became a client component
 * so the footer could be translated. `design-chrome.tsx` is a server module and
 * interpolates that string into `DESIGN_CSS`. The reference landed in the
 * stylesheet instead, the CSS parser ate the rules that followed it, and the
 * footer's columns silently collapsed into one stack. Nothing logged. The fix
 * was `footer-css.ts`: a plain module both sides can read.
 *
 * The heuristic is PascalCase, which is the same one React itself uses to tell a
 * component from a tag: `SiteFooter` may cross, `FOOTER_CSS` may not.
 *
 * ⚠️ "STARTS WITH A CAPITAL" IS NOT THE TEST, and getting that wrong made the
 * first version of this file pass against the very bug it was written for —
 * `FOOTER_CSS` starts with a capital too. A component name has a lowercase
 * letter in it and no underscore; a constant is SCREAMING_CASE. That
 * distinction is the whole guard, so it is mutation-tested: reverting the fix
 * must turn this red.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

const isClientModule = (src: string) => /^\s*["']use client["']/.test(src);

/** Resolve a relative import to the file it names, or null. */
function resolve(fromDir: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  for (const ext of [".tsx", ".ts"]) {
    const p = join(fromDir, spec + ext);
    try {
      readFileSync(p, "utf8");
      return p;
    } catch {
      /* try the next extension */
    }
  }
  return null;
}

describe("the client boundary in app/_landing", () => {
  it("never hands a non-component value to a server module", () => {
    const files = readdirSync(HERE).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test."));
    const offences: string[] = [];

    for (const file of files) {
      const src = readFileSync(join(HERE, file), "utf8");
      if (isClientModule(src)) continue; // client → client is fine

      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'](\.[^"']+)["']/g)) {
        const target = resolve(HERE, m[2]);
        if (!target || !isClientModule(readFileSync(target, "utf8"))) continue;

        for (const raw of m[1].split(",")) {
          const name = raw
            .trim()
            .split(/\s+as\s+/)[0]
            .trim();
          // `import type` is erased at build time and never crosses anything.
          if (!name || name.startsWith("type ")) continue;
          if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || !/[a-z]/.test(name)) {
            offences.push(`${file} imports the value \`${name}\` from the client module ${m[2]}`);
          }
        }
      }
    }

    expect(offences, "a value crossing into server code arrives as a client reference").toEqual([]);
  });
});
