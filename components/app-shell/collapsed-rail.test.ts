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

  /* THE MECHANISM CHANGED; THE BUG IT PREVENTS DID NOT.
     The rail was rebuilt to the "Sidebar final" design: each section is a grey
     tray and each item's icon is a tinted chip, so the row is centred by taking
     the trailing strip OUT OF FLOW and letting the link shrink to its chip,
     rather than by zeroing four separate values on a two-child flex row.

     What is still being guarded is the original failure: an icon sitting a few
     pixels left of centre, which "is exactly enough to look like a mistake
     without looking like anything in particular". Every assertion below is one
     of the things that, if it regressed, would put it back there. */

  it("takes the trailing strip out of flow, so the link shrinks to its chip", () => {
    // `max-width: 0` alone is NOT enough — a zero-width flex item still has a
    // gap beside it, which is the trap the previous fix fell into.
    const trail = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-trail");
    expect(declaration(trail, "position")).toBe("absolute");
  });

  it("removes the link's padding", () => {
    expect(declaration(link, "padding")).toBe("0 !important");
  });

  it("centres the shrunk link inside its tray", () => {
    // The tray is the flex column the links sit in; with the link shrunk to the
    // chip, this is what actually puts the glyph in the middle of the rail.
    const tray = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-section");
    expect(declaration(tray, "align-items")).toBe("center");
  });

  it("removes the gap between the glyph and its collapsed label", () => {
    expect(declaration(inner, "gap")).toBe("0 !important");
  });

  it("grows the chip to a standalone tile", () => {
    // 26px in a labelled row, 36px alone. Set INLINE in sidebar-nav.tsx, so
    // without !important this is a silent no-op and the rail collapses to 72px
    // with undersized icons rattling around in it.
    const chip = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-chip");
    expect(declaration(chip, "width")).toBe("36px !important");
    expect(declaration(chip, "height")).toBe("36px !important");
  });

  it("uses !important wherever it is beating an inline style", () => {
    // `itemBase` and `chipStyle` set these inline for the EXPANDED layout, and
    // an inline style beats an external rule whatever its specificity.
    const chip = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-chip");
    for (const [body, prop] of [
      [link, "padding"],
      [inner, "gap"],
      [chip, "width"],
      [chip, "height"],
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
 * ⚠️ THE SOLUTION CHANGED. THE BUG IT PREVENTS IS THE SAME ONE.
 *
 * The toggle used to be absolutely positioned at `right: -15px`, straddling the
 * rail's edge — a two-tone button half on the dark rail and half on the page,
 * because no single fill was legible on both grounds. It had once drifted to
 * `right: 10px`, INSIDE the rail, where at 72px a 30px button (x=32..62) landed
 * on top of the 36px logomark (x=18..54): the only control that reopens the rail
 * was drawn underneath the brand, and a rail you cannot reopen is a rail you
 * cannot use.
 *
 * The rail is white now, so the two-ground problem does not exist and the
 * straddle bought nothing; the design puts the toggle in the brand row, in
 * normal flow. That removes the overlap by construction rather than by
 * arithmetic — there is no absolute position left to drift. What these tests now
 * guard is that it STAYS in flow and that the collapsed row stacks, because
 * putting it back on top of the mark is still one careless rule away.
 */
describe("collapsed rail: the toggle stays clear of the logomark", () => {
  const shell = readFileSync(fileURLToPath(new URL("./shell.tsx", import.meta.url)), "utf8");

  /** The toggle's own JSX block. */
  const toggle = (() => {
    const at = shell.indexOf('className="lp-sb-collapse"');
    expect(at, "the collapse toggle should carry .lp-sb-collapse").toBeGreaterThan(-1);
    return shell.slice(at, at + 900);
  })();

  it("is in normal flow, not absolutely positioned over the rail", () => {
    // The whole point: an in-flow button cannot land on the logomark, whatever
    // the rail's width. A `position: absolute` here reintroduces the class of
    // bug that hid the control under the brand.
    expect(toggle).not.toMatch(/position: "absolute"/);
    expect(toggle).not.toMatch(/right: "-?\d+px"/);
  });

  it("stacks under the mark when the rail collapses, instead of beside it", () => {
    // At 72px there is no room for a 32px mark and a 28px button on one line.
    const row = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-brandrow");
    expect(declaration(row, "flex-direction")).toBe("column");
  });

  it("neutralises the auto margin that right-aligns it when expanded", () => {
    // `marginLeft: "auto"` is inline (it pushes the toggle opposite the brand on
    // one line). In a COLUMN it would shove the button to the right edge of a
    // 72px rail instead of centring it — and inline beats an external rule, so
    // this override has to be !important or it silently does nothing.
    const rule = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-collapse");
    expect(declaration(rule, "margin-left")).toBe("0 !important");
  });

  it("is dressed for the white rail it now sits on", () => {
    // It borrows the rail's own ground and hairline. A translucent white fill —
    // correct when half of it lay on a dark rail — is invisible here.
    expect(toggle).toMatch(/background: WHITE/);
    expect(toggle).not.toMatch(/background: "rgba\(255,255,255/);
  });
});
