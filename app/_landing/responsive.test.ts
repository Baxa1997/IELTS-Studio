/**
 * TWO WAYS THE PUBLIC PAGES BROKE ON A PHONE, NEITHER VISIBLE ON A DESKTOP.
 *
 * 1. `repeat(auto-fit, minmax(420px, 1fr))` reads like "one column below 420px",
 *    and is not. The track's MINIMUM is 420px: when a single column is all that
 *    fits, that column is still 420px wide inside a 319px container, and the
 *    page scrolls sideways. The hero used 420px against a container with 28px
 *    of padding each side — on a 375px phone that is 101px of overflow, on a
 *    360px Android 116px. There is no `overflow-x: hidden` anywhere to hide it.
 *
 * 2. The sign-in page is deliberately `height:100dvh; overflow:hidden` so it
 *    never scrolls — a real fix, for a real laptop problem. But that only holds
 *    while the two panels sit side by side. Stacked, the burgundy panel takes a
 *    screen of its own and the form lands below the fold of a container that
 *    clips and does not scroll. The sign-in button did not exist on a phone.
 *
 * jsdom does no layout, so this asserts the CSS that prevents both rather than
 * measuring a render.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const hero = read("../page.tsx");
const signIn = read("../(auth)/sign-in/page.tsx");
const chrome = read("./design-chrome.tsx");
const footer = read("./site-footer.tsx");

/**
 * Every auto-fit track declared in a file, with its minimum.
 *
 * ⚠️ COMMENTS ARE STRIPPED FIRST, and that is not tidiness. The fix for this
 * bug class is usually accompanied by a comment quoting the declaration that
 * caused it — the footer's does — and a guard that reads prose reports the
 * documentation as the defect.
 */
function tracks(file: string): { raw: string; min: number; capped: boolean }[] {
  const src = file.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return [...src.matchAll(/minmax\(\s*(min\()?\s*(\d+)px/g)].map((m) => ({
    raw: m[0],
    min: Number(m[2]),
    capped: Boolean(m[1]),
  }));
}

describe("no grid track can be wider than its container", () => {
  it("caps every track minimum on the hero", () => {
    const all = tracks(hero);
    expect(all.length).toBeGreaterThan(0);
    for (const t of all) {
      expect(t.capped, `minmax(${t.min}px, …) can overflow — wrap it in min(${t.min}px,100%)`).toBe(
        true,
      );
    }
  });

  it("caps it on the sign-in page too", () => {
    for (const t of tracks(signIn)) {
      expect(t.capped, `minmax(${t.min}px, …) can overflow`).toBe(true);
    }
  });

  it("caps it in the footer, which is where it shipped", () => {
    /* The footer declared `minmax(260px,1.4fr) repeat(auto-fit,minmax(170px,1fr))`
       inline and ran 940px wide on a 320px phone. `auto-fit` collapses EMPTY
       tracks; it does not reduce a count that does not fit, so the only real fix
       is a breakpoint — but capping the minimum is what stops the overflow being
       silent in between. This file did not read site-footer.tsx before, which is
       the whole reason the bug got past it. */
    const all = tracks(footer);
    expect(all.length).toBeGreaterThan(0);
    for (const t of all) {
      expect(t.capped, `minmax(${t.min}px, …) can overflow — wrap it in min(${t.min}px,100%)`).toBe(
        true,
      );
    }
  });

  it("gives the footer the breakpoints a capped track still needs", () => {
    // Capping stops the overflow; it does not stop five columns squeezing into
    // 64px each. The counts have to step down too.
    expect(footer).toMatch(/@media\(max-width:900px\)/);
    expect(footer).toMatch(/@media\(max-width:560px\)/);
    expect(footer).toMatch(/\.ft-grid\{/);
    for (const cls of ["ft-grid", "ft-inner", "ft-brand", "ft-strip"]) {
      // The rules and the markup are in one file here, but the same rename trap
      // applies — a class styled and never applied is a layout that silently
      // stops happening.
      expect(footer, `${cls} is styled but never applied`).toMatch(
        new RegExp(`className="${cls}"`),
      );
    }
  });

  it("leaves nothing that would overflow the narrowest phone", () => {
    // 320px viewport, 28px padding each side = 264px of content. Any uncapped
    // track above that overflows; a capped one cannot, whatever its stated min.
    const NARROWEST = 264;
    for (const t of [...tracks(hero), ...tracks(signIn)]) {
      if (!t.capped) expect(t.min).toBeLessThanOrEqual(NARROWEST);
    }
  });
});

describe("the sign-in page stays reachable once the panels stack", () => {
  it("keeps the no-scroll rule for the two-panel layout", () => {
    // Not a regression to undo: it fixed a real laptop problem, where the card
    // and the disclaimer fell off the bottom of the viewport.
    expect(signIn).toMatch(/height: "100dvh"/);
    expect(signIn).toMatch(/overflow: "hidden"/);
  });

  it("releases it below the width where two panels stop fitting", () => {
    expect(chrome).toMatch(/@media\(max-width:900px\)/);
    expect(chrome).toMatch(/\.lp-auth\{height:auto!important/);
    expect(chrome).toMatch(/min-height:100dvh/);
  });

  it("releases the panel's own clipping as well as the page's", () => {
    // Releasing only the page still cuts the headline off on a short screen —
    // the burgundy panel carries its own `overflow: hidden`.
    expect(chrome).toMatch(/\.lp-auth-panel\{[^}]*overflow:visible!important/);
    expect(chrome).toMatch(/\.lp-auth-form\{[^}]*overflow:visible!important/);
  });

  it("drops the proof rows rather than making somebody scroll past them", () => {
    // A screen of supporting copy between a person and a password field is the
    // wrong order. The wordmark and headline stay.
    expect(chrome).toMatch(/\.lp-auth-points\{display:none!important\}/);
    expect(signIn).toMatch(/className="lp-auth-points"/);
  });

  it("has the classes those rules target actually applied", () => {
    // The rules and the markup are in different files, so a rename in one is
    // silent in the other — and silently reinstates the unreachable form.
    for (const cls of ["lp-auth", "lp-auth-panel", "lp-auth-points", "lp-auth-form"]) {
      expect(signIn, `${cls} is styled but never applied`).toMatch(new RegExp(cls));
      expect(chrome, `${cls} is applied but never styled`).toMatch(new RegExp(`\\.${cls}[{ ]`));
    }
  });
});

describe("the footer's layout travels with the footer", () => {
  it("is injected by every page that renders one", () => {
    /* ⚠️ THE GRID USED TO BE AN INLINE STYLE, so it could not go missing. It is
       a class now — it needs breakpoints — which means a page that renders
       <SiteFooter/> without also injecting DESIGN_CSS/FOOTER_CSS gets a footer
       with no columns at all, and nothing fails: the links just stack. */
    const files = execFileSync("git", ["ls-files", "app"], { encoding: "utf8" })
      .split("\n")
      .filter((f) => /\.tsx$/.test(f) && f !== "app/_landing/site-footer.tsx");
    const missing = files.filter((f) => {
      const src = readFileSync(f, "utf8");
      // `<SiteFooter`, not the bare name: a file that DEFINES one is not a file
      // that renders one. (app/_landing/chrome.tsx exports its own and is dead
      // code — nothing imports it — so the bare form reported it every time.)
      return /<SiteFooter\b/.test(src) && !/DESIGN_CSS|FOOTER_CSS/.test(src);
    });
    expect(missing, "renders SiteFooter but injects no stylesheet").toEqual([]);
  });
});

describe("the stylesheet is a template literal, so it has no raw backticks", () => {
  it("parses as one string", () => {
    // A raw backtick inside DESIGN_CSS ends the string and takes the whole
    // module with it — which is exactly what a backtick in a CSS comment did.
    for (const [src, decl] of [
      [chrome, "export const DESIGN_CSS = `"],
      [footer, "export const FOOTER_CSS = `"],
    ] as const) {
      const start = src.indexOf(decl) + decl.length;
      const body = src.slice(start, src.indexOf("\n`;", start));
      expect(body, `a backtick in ${decl.trim()} ends the string`).not.toMatch(/`/);
    }
  });
});
