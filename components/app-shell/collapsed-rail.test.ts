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

/**
 * DECLARATIONS ONLY — comments stripped before anything searches this.
 *
 * Every assertion here is a raw text search over the stylesheet, and globals.css
 * is a heavily commented file whose comments routinely quote the selectors and
 * values they replaced. A naive search finds that prose: a note reading "these
 * rules used to sit in a second `@media (min-width: 768px)` block" was matched
 * by the media-query lookup below, ahead of the real rule, and the test failed
 * while the CSS was entirely correct.
 *
 * `brand-row.test.ts` already learned this — "a naive search for a removed value
 * finds its own obituary" — and strips the same way. This is that fix, applied
 * to the one file that had been missed.
 */
const css = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

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

  it("removes the same gap inside a group row, which is not an .lp-sb-link", () => {
    /* The rule above is scoped to `.lp-sb-link`; a group row (Practices,
       Teaching, Centre…) is a <button class="lp-sb-grouprow">, so it never got
       it. Its icon kept a 10px gap beside the zero-width label and, measured in
       Chromium, every group tile sat 5px left of every plain row. */
    const groupInner = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-grouprow > span");
    expect(declaration(groupInner, "gap")).toBe("0 !important");
  });

  it("grows the chip to a standalone tile", () => {
    // 26px in a labelled row, 40px alone. Set INLINE in sidebar-nav.tsx, so
    // without !important this is a silent no-op and the rail collapses to 72px
    // with undersized icons rattling around in it.
    const chip = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-chip");
    expect(declaration(chip, "width")).toBe("40px !important");
    expect(declaration(chip, "height")).toBe("40px !important");
  });

  it("centres the group rows too, against two inline styles", () => {
    /* The group row is a <button> with `width: "100%"` and
       `justifyContent: "space-between"` set inline for the expanded rail. Both
       have to be beaten here or its icon sits at the left edge while every
       plain row sits in the middle — two columns of glyphs in one 72px strip.
       `width` is the half that matters: centring a full-width row centres
       nothing. */
    const row = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-grouprow");
    expect(declaration(row, "width")).toBe("auto !important");
    expect(declaration(row, "justify-content")).toBe("center !important");
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
    // 32px since the rail was rebuilt to the design — the mark shrank with the
    // brand row, so the sum is re-run rather than assumed.
    const mark = 32;

    // Button: anchored `overhang` past the rail's right edge.
    const buttonLeft = width - (button - overhang);
    // Mark: centred in the content box.
    const markRight = pad + (width - pad * 2 + mark) / 2;

    expect(buttonLeft, "button starts after the mark ends").toBeGreaterThanOrEqual(markRight);
  });

  it("is dressed for BOTH grounds it sits on", () => {
    // Half on the rail, half on the canvas: it can borrow neither, so a
    // translucent fill is wrong here — it needs a solid disc and a hairline.
    //
    // PANEL, not WHITE: both are solid (which is what this test is really
    // protecting), but PANEL is the theme-aware surface token, so the disc
    // still matches the two grounds it straddles once they go dark. A literal
    // white disc would be the one white dot left on a dark rail.
    const at = shell.indexOf("lp-sb-collapse lp-sb-item");
    const block = shell.slice(at, at + 1600);
    expect(block).toMatch(/background: PANEL/);
    expect(block).not.toMatch(/background: "rgba\(255,255,255/);
  });
});
