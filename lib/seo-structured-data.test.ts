/**
 * The company and its share card, as every page states them to a crawler.
 *
 * Both were found broken on 2026-10-16 in the same way: correct on the pages
 * that were written first, wrong on the ones copied from them later. /grade
 * named the company by hand with no `@id`, logo or `sameAs`, and /grade plus
 * both guides set an `openGraph` that silently dropped the share image. So
 * these guards read every page, not the pages that exist today.
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { OFFICIAL_PROFILES } from "@/lib/contact";
import { absoluteUrl, LOGO_IMAGE, organization } from "@/lib/seo";
import { sourceFiles } from "@/test/source-files";

const code = (roots: string[]) =>
  sourceFiles(...roots).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f));

describe("the Organization", () => {
  it("is written out once, in lib/seo.ts, so every page names the same company", () => {
    const literal = /["']@type["']\s*:\s*["']Organization["']/;
    const strays = code(["app", "shared", "lib"]).filter(
      (f) => f !== "lib/seo.ts" && literal.test(readFileSync(f, "utf8")),
    );
    expect(strays, "use organization() from lib/seo.ts").toEqual([]);
  });

  it("carries the logo and the company's own accounts, and no phone chat", () => {
    const org = organization();
    expect(org.logo).toBe(absoluteUrl(LOGO_IMAGE));
    expect(org.sameAs).toEqual([...OFFICIAL_PROFILES]);
    for (const url of org.sameAs) {
      expect(url).toMatch(/^https:\/\//);
      expect(url, "wa.me is a chat with a number, not a profile").not.toMatch(/wa\.me/);
    }
  });

  it("has a logo Google will take: a square PNG of at least 112 px", () => {
    const png = readFileSync(join(process.cwd(), "public", LOGO_IMAGE));
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    const [width, height] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    expect(width).toBe(height);
    expect(width).toBeGreaterThanOrEqual(112);
  });
});

/** Every `openGraph: { … }` object in a source file, braces matched. */
function openGraphBlocks(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/openGraph\s*:\s*\{/g)) {
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}" && --depth === 0) {
        out.push(src.slice(m.index, i + 1));
        break;
      }
    }
  }
  return out;
}

/** The route folder a file belongs to: `_components`, `_lib` … are not routes. */
function routeDir(file: string): string {
  let dir = dirname(file);
  while (basename(dir).startsWith("_")) dir = dirname(dir);
  return dir;
}

describe("share cards", () => {
  /* Next merges metadata one key deep, so a page's `openGraph` REPLACES the
     root layout's whole object, image included — unless the route draws its
     own card with an opengraph-image file, which Next adds on top. */
  it("every openGraph a page sets names an image, or its route draws one", () => {
    const bare = code(["app"]).flatMap((f) => {
      const drawn = ["tsx", "ts", "jpg", "png"].some((ext) => existsSync(join(routeDir(f), `opengraph-image.${ext}`)));
      if (drawn) return [];
      return openGraphBlocks(readFileSync(f, "utf8"))
        .filter((block) => !/\bimages\s*:/.test(block))
        .map(() => f);
    });
    expect(bare, "add images: [previewImage(…)] (lib/seo.ts)").toEqual([]);
  });

  it("finds the openGraph objects it is checking", () => {
    // Without this, a regex that stopped matching would pass every page.
    expect(openGraphBlocks(readFileSync("app/grade/page.tsx", "utf8"))).toHaveLength(1);
  });
});
