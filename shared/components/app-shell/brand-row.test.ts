/**
 * The rail's brand row, and the assistant's one-screen frame.
 *
 * Both bugs here were invisible to every other kind of test. jsdom does no
 * layout, TypeScript cannot see a CSS cascade, and the pages render fine — they
 * are just WRONG on screen. What can be checked is that the specific
 * declarations the fixes turn on are still there, which is what regressed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const css = read("../../../app/globals.css");
/** Declarations only. The comments quote the values they replaced, and a naive
 *  search for a removed value finds its own obituary. */
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, "");
const wordmark = read("../brand/engprogress-logo.tsx");
const shell = read("./shell.tsx");

describe("a long centre name truncates instead of painting over the role chip", () => {
  /** The `CentreWordmark` style object only. */
  const body = (() => {
    const at = wordmark.indexOf("export function CentreWordmark");
    expect(at).toBeGreaterThan(-1);
    const end = wordmark.indexOf("export function centreInitials");
    return wordmark.slice(at, end);
  })();

  it("keeps the three declarations an ellipsis needs", () => {
    expect(body).toContain('textOverflow: "ellipsis"');
    expect(body).toContain('overflow: "hidden"');
    expect(body).toContain('whiteSpace: "nowrap"');
  });

  /* ⚠️ THE ACTUAL BUG, AND IT LOOKS LIKE A HARMLESS DISPLAY VALUE.
     `text-overflow: ellipsis` does nothing on a flex container: the text
     becomes an anonymous flex item, whose automatic minimum size under
     `nowrap` is the whole name. The box then refuses to shrink at all — so
     "Laqod Market LLC" rendered at full width straight over the chip beside
     it. Every other declaration above was already correct and none of them
     mattered. */
  it("is not a flex container, which would silently disable all three", () => {
    expect(body).not.toMatch(/display:\s*"(inline-)?flex"/);
    expect(body).toContain('display: "block"');
  });

  it("still carries the full name as a tooltip, since the visible one may be cut", () => {
    expect(body).toContain("title={name}");
  });
});

describe("the role chip gets out of the way", () => {
  it("always stacks under the name, for a centre and for us alike", () => {
    /* IT USED TO STACK ONLY FOR A CENTRE. The row was
       `flexDirection: centreName ? "column" : "row"` — stacked under a long
       centre name, side by side with our own fixed-width wordmark. The rail is
       250px now (was 272) and the brand row was rebuilt to the design as a
       square mark beside a name with the role beneath it, so there is one
       layout instead of two conditional ones.

       The guarantee is unchanged and is what this asserts: the role never
       shares a line with the name. One line leaves ~99px for the name — nine
       characters — which truncates every real centre to nonsense and leaves the
       ellipsis work above with nothing worth showing. */
    const at = shell.indexOf('className="lp-sb-brandtext"');
    expect(at, "the brand row should carry a stacked name/role block").toBeGreaterThan(-1);
    const block = shell.slice(at, at + 1200);
    expect(block).toMatch(/flexDirection: "column"/);
    expect(shell).not.toContain('flexDirection: centreName ? "column" : "row"');
  });

  it("is removed from flow in the collapsed rail, not merely zero-width", () => {
    // `max-width: 0` is enough for text ON a row and not enough for a box
    // stacked UNDER one: its padding and line-height still take vertical space.
    const at = css.indexOf(".lp-shell-sidebar--collapsed .lp-sb-rolechip {");
    expect(at).toBeGreaterThan(-1);
    expect(css.slice(at, css.indexOf("}", at))).toContain("display: none");
  });
});

describe("the assistant is one screen, and only its middle scrolls", () => {
  it("no longer reverse-engineers its height from the viewport", () => {
    // `calc(100dvh - 22px)` was the surface's insets worked out by hand. It
    // was wrong the moment the quota bar shared the surface, and the whole
    // page scrolled — composer below the fold, header off the top.
    expect(cssRules).not.toContain("calc(100dvh - 22px)");
  });

  it("hands the height down the chain instead", () => {
    expect(shell).toContain("lp-shell-surface--fills");
    expect(shell).toContain("lp-shell-content");
    for (const selector of [
      ".lp-shell-surface--fills",
      ".lp-shell-surface--fills > .lp-shell-content",
    ]) {
      expect(css, `missing rule: ${selector}`).toContain(`${selector} {`);
    }
    // The console's own wrapper is in the middle of that chain: a percentage
    // height dies at the first ancestor without one.
    expect(css).toContain(".lp-shell-surface--fills .cn-root");
  });

  it("pins the chain to desktop only, so a phone still scrolls normally", () => {
    // A wrapper that cannot grow would CUT a tall page off on a small screen.
    const at = css.indexOf(".lp-shell-surface--fills {");
    const query = css.lastIndexOf("@media", at);
    expect(css.slice(query, at)).toContain("min-width: 901px");
  });

  it("only the assistant asks for it", () => {
    const at = shell.indexOf("function fillsTheSurface");
    expect(at).toBeGreaterThan(-1);
    const body = shell.slice(at, shell.indexOf("}", at));
    expect(body).toContain("/console/assistant");
  });
});
