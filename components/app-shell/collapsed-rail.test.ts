/**
 * The collapsed rail's glyph position, guarded property by property.
 *
 * This is here because I fixed it twice and got it wrong the first time.
 *
 * The glyph's horizontal position is decided by FOUR values, not one, and
 * zeroing any three of them still leaves the icon visibly off-centre — which
 * looks identical to not having fixed it at all:
 *
 *   1. the link's own `padding-left` / `padding-right`   (11px, inline)
 *   2. the link's own `gap`, between the icon wrapper and
 *      the trailing count/badge strip                     (11px, inline)
 *   3. the `gap` inside the icon wrapper, between the
 *      glyph and the collapsed label                      (11px, inline)
 *   4. `justify-content`, which is `space-between` inline
 *
 * The trap in (2) and (3): `.lp-sb-label` and `.lp-sb-trail` collapse to
 * `max-width: 0`, so they contribute no width — but a flex GAP beside a
 * zero-width item is still a gap. The first fix zeroed (3) alone and left the
 * icon 5.5px left of a 24px centre.
 *
 * jsdom does no layout, so this cannot measure a rendered box. What it can do is
 * assert that all four are neutralised in the stylesheet, which is the thing
 * that actually regressed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

/** The declaration body of a rule, by exact selector. */
function ruleBody(selector: string): string {
  const at = css.indexOf(selector + " {");
  expect(at, `selector not found: ${selector}`).toBeGreaterThan(-1);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

/** Read one declaration out of a rule body, comments stripped. */
function declaration(body: string, prop: string): string | null {
  const stripped = body.replace(/\/\*[\s\S]*?\*\//g, "");
  const m = new RegExp(`(?:^|;|\\n)\\s*${prop}\\s*:([^;]+);`).exec(stripped);
  return m ? m[1].trim() : null;
}

const LINK = ".lp-shell-sidebar--collapsed .lp-sb-link";
const INNER = ".lp-shell-sidebar--collapsed .lp-sb-link > span";

describe("collapsed rail: the glyph sits dead centre", () => {
  const link = ruleBody(LINK);
  const inner = ruleBody(INNER);

  it("centres the flex row", () => {
    // `space-between` inline would push the glyph to the left edge.
    expect(declaration(link, "justify-content")).toBe("center !important");
  });

  it("removes the link's horizontal padding", () => {
    expect(declaration(link, "padding-left")).toBe("0 !important");
    expect(declaration(link, "padding-right")).toBe("0 !important");
  });

  /** The one the first fix missed. */
  it("removes the gap between the icon wrapper and the trailing strip", () => {
    expect(declaration(link, "gap")).toBe("0 !important");
  });

  it("removes the gap between the glyph and its collapsed label", () => {
    expect(declaration(inner, "gap")).toBe("0 !important");
  });

  it("uses !important on every one of them", () => {
    // All four are set inline by `itemBase` for the EXPANDED layout, and an
    // inline style beats an external rule. A declaration here without
    // !important is a silent no-op.
    for (const [body, prop] of [
      [link, "justify-content"],
      [link, "padding-left"],
      [link, "padding-right"],
      [link, "gap"],
      [inner, "gap"],
    ] as const) {
      expect(declaration(body, prop), `${prop} needs !important`).toContain("!important");
    }
  });

  it("keeps the collapsed label and trail out of the layout", () => {
    // Zero WIDTH is what makes centring the glyph alone possible; if either ever
    // regains width the row is off-centre again no matter what the gaps say.
    const collapsedText = ruleBody(
      ".lp-shell-sidebar--collapsed .lp-sb-label,\n  .lp-shell-sidebar--collapsed .lp-sb-wordmark,\n  .lp-shell-sidebar--collapsed .lp-sb-soon-badge,\n  .lp-shell-sidebar--collapsed .lp-sb-trail,\n  .lp-shell-sidebar--collapsed .lp-sb-profile-text,\n  .lp-shell-sidebar--collapsed .lp-sb-profile-chev",
    );
    expect(declaration(collapsedText, "max-width")).toBe("0 !important");
    expect(declaration(collapsedText, "margin-left")).toBe("0 !important");
  });
});

describe("collapsed rail: the box the glyph is centred in", () => {
  it("is 48px — a 72px rail less 12px of padding each side", () => {
    // The numbers the centring arithmetic depends on. If the rail is ever
    // re-sized, this fails and whoever changed it re-does the sum.
    const rail = ruleBody(".lp-shell-sidebar--collapsed");
    expect(declaration(rail, "width")).toBe("72px");
    expect(declaration(rail, "padding-left")).toBe("12px !important");
    expect(declaration(rail, "padding-right")).toBe("12px !important");
  });
});

/**
 * The way OUT of the collapsed rail.
 *
 * The toggle is anchored to the rail's right EDGE and hangs half over the page —
 * that overhang is the design (a two-tone button straddling the boundary) and it
 * is also what keeps the button clear of the brand as the rail narrows.
 *
 * It had drifted to `right: 10px`, INSIDE the rail. Expanded that merely lost the
 * straddle; collapsed it was fatal. A 30px button at `right: 10px` on a 72px rail
 * occupies x=32..62, and the 36px logomark centred in the 48px content box
 * occupies x=18..54 — so the only control that reopens the rail was drawn
 * underneath the brand, and a rail you cannot reopen is a rail you cannot use.
 *
 * Anchored to the edge instead, the button sits at x=57..87 and the two never
 * meet — at any rail width, with no collapsed-only rule to keep in sync.
 */
describe("collapsed rail: the toggle straddles the edge, clear of the logomark", () => {
  const shell = readFileSync(fileURLToPath(new URL("./shell.tsx", import.meta.url)), "utf8");

  it("anchors the button to the rail's edge, not inside it", () => {
    // Half of 30px. A positive value here is the regression.
    expect(shell).toMatch(/right: "-15px"/);
    expect(shell).not.toMatch(/right: "10px"/);
  });

  it("gives it a positioned rail to anchor to on desktop", () => {
    // `position: absolute` resolves against the nearest positioned ancestor.
    // Without this the button escapes to the viewport and lands anywhere.
    const desktopRail = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(desktopRail.slice(0, desktopRail.indexOf("}"))).toMatch(/position:\s*relative/);
  });

  it("needs no collapsed-only rule, because the edge moves for it", () => {
    // A collapsed override would be a second source of truth for the same
    // position, and the two would drift. The arithmetic below is why none is
    // needed; if someone adds one, this says to re-check the sum instead.
    expect(css).not.toMatch(/\.lp-shell-sidebar--collapsed \.lp-sb-collapse\s*\{/);
  });

  it("clears the logomark at 72px — the sum, kept honest", () => {
    const rail = ruleBody(".lp-shell-sidebar--collapsed");
    const width = Number(declaration(rail, "width")?.replace("px", ""));
    const pad = Number(declaration(rail, "padding-left")?.replace(/\D/g, ""));
    const button = 30;
    const overhang = 15;
    const mark = 36;

    // Button: anchored `overhang` past the rail's right edge.
    const buttonLeft = width - (button - overhang);
    // Mark: centred in the content box.
    const markRight = pad + (width - pad * 2 + mark) / 2;

    expect(buttonLeft, "button starts after the mark ends").toBeGreaterThanOrEqual(markRight);
  });

  it("is dressed for BOTH grounds it sits on", () => {
    // Half on a dark rail, half on a light page: it can borrow neither, so a
    // translucent-white fill (what the rail's own items use) is wrong here.
    const at = shell.indexOf("lp-sb-collapse lp-sb-item");
    const block = shell.slice(at, at + 1400);
    expect(block).toMatch(/background: WHITE/);
    expect(block).not.toMatch(/background: "rgba\(255,255,255/);
  });
});
