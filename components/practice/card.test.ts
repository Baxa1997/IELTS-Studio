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

/**
 * One component's source, from its signature to its closing brace.
 *
 * The end is a `}` alone on its line — NOT the first `\n}`, which in this file
 * lands on the closing brace of a destructured parameter's type annotation
 * (`}: {` … `}) {`) and would cut most components off at their signature.
 */
function fnBody(name: string): string {
  const at = card.indexOf(`function ${name}(`);
  expect(at, `${name} moved or was renamed`).toBeGreaterThan(-1);
  const rest = card.slice(at);
  const end = /\n\}(?:\n|$)/.exec(rest);
  expect(end, `${name} has no closing brace`).not.toBeNull();
  return rest.slice(0, end!.index);
}

/** One property out of a JS style object, which is comma-separated — unlike
 *  `declaration()` above, which reads semicolon-separated CSS. */
function styleProp(style: string, prop: string): string | null {
  const m = new RegExp(`(?:^|[,{\\s])${prop}\\s*:\\s*([^,\\n]+)`).exec(style);
  return m ? m[1].trim() : null;
}

/**
 * A style property whose value has commas of its own — a gradient, a multi-part
 * box-shadow — which styleProp()'s comma delimiter cuts off at the first one.
 * Reads to the next property name at the start of a line instead.
 */
function styleValue(style: string, prop: string): string {
  const at = style.indexOf(`${prop}:`);
  expect(at, `no ${prop} in this style object`).toBeGreaterThan(-1);
  const rest = style.slice(at + prop.length + 1);
  const next = /\n\s*[A-Za-z]+:/.exec(rest);
  return rest.slice(0, next ? next.index : undefined).trim();
}

/**
 * The comma-separated parts of a shadow, with the colour functions collapsed
 * first so their own commas do not split it.
 *
 * ⚠️ `.filter(Boolean)` IS LOAD-BEARING. The style object's trailing comma
 * yields an empty final part, and an empty string starts with nothing — so
 * "is any layer not inset?" answered yes for a shadow that was entirely inset,
 * and the mutation that drops the outer lift went through undetected.
 */
function shadowLayers(value: string): string[] {
  return value
    .replace(/rgba?\([^)]*\)/g, "«colour»")
    .split(",")
    .map((p) => p.trim().replace(/^["'\s]+|["'\s,]+$/g, ""))
    .filter(Boolean);
}

/** The innermost `style={{ … }}` that declares `prop` — which is how a two-element
 *  component is told apart from the one-element version that had the bug. */
function styleCarrying(fn: string, prop: string): string {
  const at = fn.indexOf(`${prop}:`);
  expect(at, `no ${prop} in this component`).toBeGreaterThan(-1);
  const open = fn.lastIndexOf("style={{", at);
  expect(open, `${prop} is not inside a style object`).toBeGreaterThan(-1);
  return fn.slice(open, fn.indexOf("}}", at));
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

// ---- 6. Truncation that looks like truncation ------------------------------

/**
 * ⚠️ PADDING ON A CLAMPED ELEMENT SHOWS THE LINE THE CLAMP DROPPED.
 *
 * `-webkit-line-clamp` stops laying out lines at the clamp, but `overflow:
 * hidden` clips at the PADDING box, not the content box. Put both on one
 * element and its padding-bottom becomes a window onto the next line: the quote
 * rendered two clamped lines ending in "…" and then a half-height third line
 * beneath them, which reads as a broken card rather than a shortened prompt.
 *
 * Nothing catches it but the eye — no error, no type failure, no layout
 * exception, and jsdom does no layout — and folding the two elements back into
 * one is exactly the kind of tidy-up that looks like an improvement.
 */
describe("clamped text is cut at a line, not through one", () => {
  it("keeps the quote's padding off the element that clamps", () => {
    const quote = fnBody("CardQuote");
    const clamped = styleCarrying(quote, "WebkitLineClamp");
    expect(
      clamped.includes("padding"),
      "the quote clamps and pads the same element — its padding-bottom will show " +
        "the top of the line the clamp dropped",
    ).toBe(false);
    // And the padding is still there, on the box around it.
    expect(quote).toContain('padding: "9px 11px"');
  });

  it("gives the clamp the box orientation it is inert without", () => {
    // -webkit-line-clamp does nothing on its own: drop the orient and the text
    // stops truncating entirely, silently.
    for (const fn of ["CardQuote", "clampLines"]) {
      expect(fnBody(fn), `${fn} lost WebkitBoxOrient`).toContain('WebkitBoxOrient: "vertical"');
    }
  });

  it("never pads what clampLines styles", () => {
    // Same trap, one level up: clampLines is spread onto the title.
    const title = styleCarrying(fnBody("CardBody"), "letterSpacing");
    expect(title.includes("padding"), "the title pads and clamps the same element").toBe(false);
  });

  it("reserves the height it clamps to, so a row stays level", () => {
    /* A clamp alone only sets a ceiling. Without the floor, a one-line title
       next to a two-line one shortens its whole card and the grid goes ragged —
       the reason the canvas clamped to one line to begin with. */
    expect(fnBody("clampLines")).toContain("minHeight:");
    expect(fnBody("CardQuote")).toContain("minHeight:");
  });

  it("offers only the line counts it reserves height for", () => {
    // `titleLines: number` would let a caller ask for 3 and get a clamp with no
    // matching floor. The union is what keeps the two in step.
    expect(card).toContain("titleLines?: 1 | 2");
  });
});

// ---- 7. The eyebrow is legible ---------------------------------------------

/**
 * The line that says which skill the card is. At the canvas's 10px in #8B919D
 * it sat around 3:1 against white — under the 4.5:1 AA floor for small text,
 * and the owner's report was simply that they could not see it. It is now white
 * on the brand, in a raised pill.
 */
describe("the skill pill can actually be read", () => {
  const pill = styleCarrying(fnBody("SkillPill"), "letterSpacing");

  it("is at least 11px and bold", () => {
    expect(Number(/fontSize: (\d+)/.exec(pill)?.[1])).toBeGreaterThanOrEqual(11);
    expect(Number(/fontWeight: (\d+)/.exec(pill)?.[1])).toBeGreaterThanOrEqual(700);
  });

  it("is white on the brand, which is where its contrast comes from", () => {
    expect(styleProp(pill, "color")).toBe('"#fff"');
    expect(styleValue(pill, "background")).toContain("BRAND");
  });

  it("carries no border", () => {
    /* The owner's instruction, and the reason is visible: the card already has a
       1px edge, so a second ring 9px inside it reads as a mistake. */
    expect(styleProp(pill, "border"), "the skill pill grew a border").toBeNull();
    expect(styleProp(pill, "borderColor")).toBeNull();
  });

  it("keeps the three declarations that make it look raised", () => {
    /* A flat fill reads as a tag. The gradient lights the top edge and shades
       the bottom, the INSET highlight is the gloss along that top edge, and the
       outer shadow lifts it off the card — drop any one and it goes flat. */
    expect(styleValue(pill, "background"), "the gradient went flat").toContain("linear-gradient");
    const layers = shadowLayers(styleValue(pill, "boxShadow"));
    expect(
      layers.some((l) => l.startsWith("inset 0 1px 0")),
      "no inset highlight along the top edge",
    ).toBe(true);
    expect(
      layers.some((l) => !l.startsWith("inset")),
      "every shadow layer is inset — nothing lifts the pill off the card",
    ).toBe(true);
  });

  it("holds the qualifier tail at a colour that passes on white", () => {
    /* The tail is still plain text on the card — "TASK 1 GT · HOUSING" — so the
       contrast rule applies to it as it did to the whole eyebrow. DIM (#8B919D)
       is the 3:1 grey this was; MUTED (#4A505C) is 7.7:1. */
    const tail = styleCarrying(fnBody("CardEyebrow"), "letterSpacing");
    expect(styleProp(tail, "color")).toBe("MUTED");
    expect(Number(/fontSize: (\d+)/.exec(tail)?.[1])).toBeGreaterThanOrEqual(11);
  });

  it("keeps Listening's detail chip in step with that tail", () => {
    // A card shows one or the other depending on the hub, and the two hubs are
    // one click apart, so a size or weight that drifts between them is visible.
    const tail = styleCarrying(fnBody("CardEyebrow"), "letterSpacing");
    const chip = styleCarrying(fnBody("MonoChip"), "letterSpacing");
    expect(/fontSize: (\d+)/.exec(chip)?.[1]).toBe(/fontSize: (\d+)/.exec(tail)?.[1]);
    expect(/fontWeight: (\d+)/.exec(chip)?.[1]).toBe(/fontWeight: (\d+)/.exec(tail)?.[1]);
  });

  it("raises the skill and leaves the detail flat", () => {
    /* Both of Listening's facts as raised pills would say the accent matters as
       much as the skill does. The icon is what marks the skill chip. */
    const head = fnBody("CardHead");
    expect(head).toContain("c.icon ? (");
    expect(head).toContain("<SkillPill");
    expect(head).toContain("<MonoChip");
    expect(fnBody("MonoChip"), "the detail chip is raised too").not.toContain("linear-gradient");
  });
});
