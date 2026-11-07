import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { sourceFiles } from "@/test/source-files";

import { SCREEN, SCREEN_VH } from "./tokens";

/**
 * Every frame exactly one screen tall takes SCREEN (./tokens), which leaves room
 * for a site-wide notice band when one is up. Kept from the service notice of
 * 2026-10-24 (commit b060761) after the notice itself was taken down, so that
 * putting the next one up is a component in the root layout and nothing more.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("SCREEN", () => {
  it("is the viewport less the notice band, which is nothing when none is up", () => {
    expect(SCREEN).toBe("calc(100dvh - var(--ep-notice-h, 0px))");
    expect(SCREEN_VH).toBe("calc(100vh - var(--ep-notice-h, 0px))");
  });
});

describe("a full-screen frame", () => {
  /* Under a notice, a frame exactly 100dvh tall runs off the bottom by the
     notice's height: the document scrolls, and whatever the frame pins to its
     bottom edge is cut off. Such a frame takes SCREEN. A slide-over covers the
     whole screen, notice included, so it keeps 100dvh. */
  it("leaves room for a notice instead of taking a bare 100dvh", () => {
    const bare = /(?<![\w-])height:\s*"?100[ds]?vh\b|(?<![\w-])h-(?:screen|dvh|svh)\b/g;
    const offenders: string[] = [];
    for (const file of sourceFiles("app", "shared").filter((f) => /\.(tsx?|css)$/.test(f))) {
      if (/\.test\.tsx?$/.test(file)) continue;
      const src = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|\s)\/\/.*$/gm, "$1");
      for (const m of src.matchAll(bare)) {
        if (src.slice(Math.max(0, m.index - 400), m.index).includes('className="cn-slideover"'))
          continue;
        offenders.push(`${file}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
