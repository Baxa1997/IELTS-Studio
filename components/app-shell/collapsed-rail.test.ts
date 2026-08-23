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
