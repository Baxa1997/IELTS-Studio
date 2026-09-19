/**
 * The shared practice card, guarded where it fails SILENTLY.
 *
 * Every check here is for a defect that produces no error, no type failure and
 * no rendering exception — the card simply looks right at rest and misbehaves
 * under the pointer, which is precisely the class of bug this repo has now
 * recorded five times:
 *
 *   1. AN INLINE `background` OR `border` BEATS THE STYLESHEET HOVER.
 *      `.pc-card:hover` and `.pc-act--primary:hover` change border-color and
 *      background. Set either inline on the same element and the hover reaches
 *      nothing, whatever the specificity — the card never lifts, the button
 *      never darkens. This is the trap written up at length in
 *      ../app-shell/nav-groups.test.ts ("rows keep the hover the stylesheet
 *      gives them"), and the card kit is the newest place it could land.
 *   2. A CONDITIONAL CLASS THAT LOST ITS SEPARATING SPACE.
 *      `prettier --write` eats the space in `${on ? " pc-x" : ""}`, welding two
 *      class names into one that matches no rule. Hence cx().
 *   3. A TONE WITH NO RULE BEHIND IT. `data-tone` is what selects the hover, so
 *      a tone the TSX can emit but the stylesheet never matches is a card that
 *      quietly stops lifting.
 *
 * jsdom does no layout and applies no stylesheet, so none of this is observable
 * by rendering. What can be asserted is that the declarations each fix depends
 * on are still there, which is the thing that actually regresses.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** DECLARATIONS ONLY — globals.css quotes in its own comments the very values it
 *  warns against, and a naive search finds its own obituary (the trap recorded
 *  in brand-row.test.ts and again in nav-groups.test.ts). */
const css = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** The card kit, comments stripped for the same reason. */
const raw = readFileSync(fileURLToPath(new URL("./card.tsx", import.meta.url)), "utf8");
const card = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

function ruleBody(selector: string): string {
  const at = css.indexOf(selector + " {");
  expect(at, `selector not found: ${selector}`).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("}", at));
}

function declaration(body: string, prop: string): string | null {
  const m = new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;]+)`).exec(body);
  return m ? m[1].trim() : null;
}

// ---- 1. The surface lives in the stylesheet ---------------------------------

describe("the card keeps the hover the stylesheet gives it", () => {
  it("paints the resting surface in CSS, not inline", () => {
    // Both are what :hover changes, so both have to come from the rule.
    const body = ruleBody(".pc-card");
    expect(declaration(body, "background")).toBe("#fff");
    expect(declaration(body, "border")).toBe("1px solid rgba(28, 27, 46, 0.09)");
  });

  it("sets no inline background or border on the card element itself", () => {
    /* The card's own JSX: `className="pc-card"` and the style object beside it.
       Anything that paints a fill or an edge there cancels the hover. */
    const at = card.indexOf('className="pc-card"');
    expect(at, "the card element moved").toBeGreaterThan(-1);
    const element = card.slice(at, card.indexOf(">", at));
    for (const prop of ["background", "border", "borderColor", "boxShadow"]) {
      expect(element.includes(`${prop}:`), `${prop} is inline on .pc-card`).toBe(false);
    }
  });

  it("paints both action pills in CSS, hover included", () => {
    expect(declaration(ruleBody(".pc-act--primary"), "background")).toBe("#7d0132");
    expect(declaration(ruleBody(".pc-act--primary:hover:not(:disabled)"), "background")).toBe(
      "#64012a",
    );
    expect(declaration(ruleBody(".pc-act--secondary"), "background")).toBe("#fff");
    expect(declaration(ruleBody(".pc-act--secondary:hover:not(:disabled)"), "background")).toBe(
      "#f6f7f9",
    );
    expect(declaration(ruleBody(".pc-act--attach"), "background")).toBe("#fdf4f7");
    expect(declaration(ruleBody(".pc-act--attach:hover:not(:disabled)"), "background")).toBe(
      "#fbe9ef",
    );
  });

  it("never styles an action inline", () => {
    // CardAction renders className only — a style prop on it would outrank the
    // three :hover rules above and every pill would go dead under the pointer.
    const at = card.indexOf("export function CardAction");
    const fn = card.slice(at, card.indexOf("\n}", at));
    expect(fn.includes("style="), "CardAction sets an inline style").toBe(false);
  });
});

// ---- 2. Conditional classes are joined by code ------------------------------

describe("class names keep their separating space", () => {
  it("joins them with cx()", () => {
    expect(card).toContain("function cx(");
    const at = card.indexOf("function cx(");
    expect(card.slice(at, at + 240)).toContain('.join(" ")');
  });

  it("emits no interpolated class that could have lost its separator", () => {
    /* The invariant, stated the way nav-groups.test.ts had to restate it: once a
       template literal has opened an interpolation, any class name it contributes
       must begin with a space — so a bare `"pc-` after the first `${` is the
       defect, whichever branch of a ternary it sits in. */
    for (const m of card.matchAll(/className=\{`([^`]*)`\}/g)) {
      const body = m[1];
      const opened = body.indexOf("${");
      if (opened === -1) continue;
      const rest = body.slice(opened);
      expect(
        rest.includes('"pc-') || rest.includes("'pc-"),
        `class list has lost its separating space: \`${body}\``,
      ).toBe(false);
    }
  });
});

// ---- 3. Every tone the card can emit has a rule -----------------------------

describe("data-tone selects a hover that exists", () => {
  /** The tones the union allows, read off the type rather than hardcoded. */
  const tones = (() => {
    const m = /export type CardTone =([^;]+);/.exec(card);
    expect(m, "CardTone moved").not.toBeNull();
    return [...m![1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]);
  })();

  it("has more than one tone to check", () => {
    expect(tones.length).toBeGreaterThan(1);
  });

  it.each(tones)("%s lifts and tints", (tone) => {
    const body = ruleBody(`.pc-card[data-tone="${tone}"]:hover`);
    expect(declaration(body, "border-color"), `${tone} has no border-color`).not.toBeNull();
    expect(declaration(body, "box-shadow"), `${tone} has no box-shadow`).not.toBeNull();
  });

  it("lifts on any tone, and only when one is set", () => {
    /* `null` is the "not right now" tone — PracticeCard drops the attribute
       entirely, so a locked or mid-clone card must not lift. The rule is
       attribute-gated rather than bare `.pc-card:hover` for exactly that. */
    expect(declaration(ruleBody(".pc-card[data-tone]:hover"), "transform")).toBe(
      "translateY(-2px)",
    );
    expect(css.includes(".pc-card:hover {"), "an ungated hover would lift a locked card").toBe(
      false,
    );
    expect(card).toContain("data-tone={tone ?? undefined}");
  });
});

// ---- 4. The canvas's geometry, which is the whole point of the redesign -----

describe("the card still measures what the design canvas specifies", () => {
  it("keeps the shell's geometry", () => {
    const body = ruleBody(".pc-card");
    expect(declaration(body, "border-radius")).toBe("14px");
    expect(declaration(body, "padding")).toBe("15px 16px");
    expect(declaration(body, "gap")).toBe("12px");
  });

  it("keeps the action pills at 34px and fully round", () => {
    const body = ruleBody(".pc-act");
    expect(declaration(body, "height")).toBe("34px");
    expect(declaration(body, "border-radius")).toBe("9999px");
    expect(declaration(body, "font-weight")).toBe("700");
  });

  it("presses the pill in on click", () => {
    expect(declaration(ruleBody(".pc-act:active:not(:disabled)"), "transform")).toBe("scale(0.97)");
  });

  it("honours a reduced-motion preference", () => {
    // The lift and the press are decoration; both are dropped under the query.
    const at = css.indexOf("@media (prefers-reduced-motion: reduce)", css.indexOf(".pc-card"));
    expect(at, "no reduced-motion block for the card").toBeGreaterThan(-1);
    const block = css.slice(at, at + 400);
    expect(block).toContain(".pc-card");
    expect(block).toContain("transition: none");
  });
});

// ---- 5. The pill's inset highlight, which is what makes it read as a chip ---

describe("the status pill", () => {
  it("keeps its inset highlight on every tone", () => {
    // One shared boxShadow, so this is a single assertion rather than four.
    expect(card).toContain("inset 0 1px 0 rgba(255,255,255,.9)");
  });

  it("offers exactly the four states the canvas draws", () => {
    const m = /export type PillTone =([^;]+);/.exec(card);
    expect(m).not.toBeNull();
    const tones = [...m![1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]);
    expect(tones.sort()).toEqual(["band", "new", "progress", "target"]);
  });
});
