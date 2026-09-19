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
    .map((p) => p.trim().replace(/^["'`\s]+|["'`\s,]+$/g, ""))
    .filter(Boolean);
}

/** `const NAME = "#hex"` from the kit, so SKILL_TONE's `base: BRAND` resolves. */
const HEX_CONSTS: Record<string, string> = Object.fromEntries(
  [...card.matchAll(/const ([A-Z_]+) = "(#[0-9A-Fa-f]{6})";/g)].map((m) => [m[1], m[2]]),
);

/** SKILL_TONE, read off the source with its constants resolved. */
type Tone = { top: string; base: string; foot: string; ink: string };
const SKILL_TONES: Record<string, Tone> = (() => {
  const at = card.indexOf("const SKILL_TONE: ");
  expect(at, "SKILL_TONE moved or was renamed").toBeGreaterThan(-1);
  const block = card.slice(at, card.indexOf("\n};", at));
  const out: Record<string, Tone> = {};
  for (const m of block.matchAll(
    /([A-Z]+): \{\s*top: "(#[0-9A-Fa-f]{6})",\s*base: "?(#?[0-9A-Fa-f]{6}|[A-Z_]+)"?,\s*foot: "(#[0-9A-Fa-f]{6})",\s*ink: "?(#?[0-9A-Fa-f]{6}|[A-Z_]+)"?/g,
  )) {
    const hex = (v: string) => HEX_CONSTS[v] ?? v;
    out[m[1]] = { top: m[2], base: hex(m[3]), foot: m[4], ink: hex(m[5]) };
  }
  expect(Object.keys(out).length, "SKILL_TONE parsed to nothing — its shape changed").toBe(3);
  return out;
})();

/** Relative luminance of a #rrggbb colour, per WCAG 2.x. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Contrast ratio between two colours, per WCAG 2.x. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue in degrees, for keeping a skill out of the status pill's green/amber arc. */
function hue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Every skill label the three hubs hand to CardHead, in its three written
 *  forms: `label="READING · …"`, `label={["WRITING", …]}` and `label: "LISTENING"`. */
function skillsPassedByHubs(): string[] {
  const hubs = [
    "../../app/(shell)/read/read-hub.tsx",
    "../../app/(shell)/write/library.tsx",
    "../../app/(shell)/listen/listening-client.tsx",
  ];
  const found = new Set<string>();
  for (const rel of hubs) {
    const src = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
    for (const re of [
      /label="([A-Z]{3,})(?:"| · )/g,
      /label=\{\["([A-Z]{3,})"/g,
      /label: "([A-Z]{3,})"/g,
    ]) {
      for (const m of src.matchAll(re)) found.add(m[1]);
    }
  }
  return [...found];
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

  it("draws its text in its skill's ink, not a shared one", () => {
    expect(styleProp(pill, "color")).toBe("t.ink");
    // All three stops come from the skill's tone — a hardcoded stop would leave
    // one band of the gradient burgundy on every hub.
    const bg = styleValue(pill, "background");
    for (const stop of ["t.top", "t.base", "t.foot"]) {
      expect(bg, `the gradient does not use ${stop}`).toContain(stop);
    }
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

  it("gives each skill its own fill", () => {
    const bases = Object.values(SKILL_TONES).map((t) => t.base);
    expect(new Set(bases).size, "two skills share a fill — they stop differentiating").toBe(
      bases.length,
    );
  });

  it("keeps every label readable on its own fill", () => {
    /* ⚠️ THE WHOLE POINT OF THE PILL. Lightening the fill was the owner's call,
       and the way that goes wrong is silently: a tint drifts darker, or an ink
       drifts lighter, and the label goes back to being hard to read — the exact
       bug the pill was built to fix. 4.5:1 is the AA floor for text this size.

       ⚠️ EVERY STOP, not just the darkest. Checking `foot` alone assumes the
       gradient runs light-to-dark, and nothing enforces that — a dark `top`
       then leaves the ink unreadable across the upper half of the pill and no
       test says a word. That mutation went through on the first attempt. */
    for (const [skill, t] of Object.entries(SKILL_TONES)) {
      for (const stop of ["top", "base", "foot"] as const) {
        expect(
          contrast(t.ink, t[stop]),
          `${skill}: ${t.ink} on its ${stop} (${t[stop]}) is too close to read`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps every fill light, which is what was asked for", () => {
    // A tint that drifts dark takes the ink's contrast with it, and the pill
    // goes back to being the second loudest thing on the card.
    for (const [skill, t] of Object.entries(SKILL_TONES)) {
      for (const stop of ["top", "base", "foot"] as const) {
        expect(
          contrast("#FFFFFF", t[stop]),
          `${skill}'s ${stop} (${t[stop]}) is no longer a light tint`,
        ).toBeLessThan(2);
      }
    }
  });

  it("keeps every skill clear of the status pill's green and amber", () => {
    /* The status pill sits on the same row: green is an earned band, amber an
       unfinished run. A skill wearing either reads as a result. */
    /* Read off the INK, not the tint: a tint this pale is nearly neutral, and a
       near-neutral colour's hue swings wildly on a one-digit change. The ink is
       also what the eye actually reads as the skill's colour. */
    for (const [skill, t] of Object.entries(SKILL_TONES)) {
      const h = hue(t.ink);
      expect(h < 35 || h > 200, `${skill} (${t.ink}) is in the green/amber arc`).toBe(true);
    }
  });

  it("has a fill for every skill the three hubs actually pass", () => {
    /* ⚠️ THE FALLBACK IS SILENT. An unrecognised skill drops back to burgundy
       rather than breaking, so a renamed label would take its colour with it and
       nothing would say so. This is what notices. */
    const passed = skillsPassedByHubs();
    expect(passed.length, "found no skill labels — the regexes have gone stale").toBe(3);
    for (const skill of passed) {
      expect(Object.keys(SKILL_TONES), `${skill} has no fill and would fall back`).toContain(skill);
    }
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
