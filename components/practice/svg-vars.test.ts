import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A CSS CUSTOM PROPERTY IS NOT VALID IN AN SVG PRESENTATION ATTRIBUTE.
 *
 * `fill="var(--pc-wave)"` does not resolve. The shape renders BLACK, nothing
 * throws, nothing logs, and in light mode on a white card it can even look
 * deliberate. The fix is always the same — move it to `style`, where the
 * cascade does resolve it:
 *
 *     <rect fill="var(--x)" />              ✗ silently black
 *     <rect style={{ fill: "var(--x)" }} /> ✓
 *
 * ⚠️ THIS IS GUARDED BECAUSE IT HAS HAPPENED TWICE, both times to code that had
 * just been converted from a literal to a token — which is exactly when it is
 * easiest to do: the attribute took a hex perfectly well a moment ago. The
 * tokenising codemod deliberately keys on the `:` in a style object so it never
 * touches attributes; these two were written by hand.
 */
const ROOT = process.cwd();
const ATTR = /\b(fill|stroke|stopColor|stop-color|floodColor|flood-color|lightingColor)="var\(--/;

describe("SVG presentation attributes", () => {
  it("never carry a CSS variable", () => {
    const files = execFileSync("git", ["ls-files", "app", "components"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => /\.tsx$/.test(f));

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(join(ROOT, file), "utf8")
        // The rule is documented in prose in a couple of places; a comment
        // quoting the broken form is not the broken form.
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");
      src.split("\n").forEach((line, i) => {
        if (ATTR.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
