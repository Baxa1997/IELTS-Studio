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
 * SKILL_TONE, resolved through globals.css — FOR BOTH THEMES.
 *
 * ⚠️ THIS BLOCK USED TO BE DEAD, and the component's header claimed otherwise.
 * card.tsx says "Every base is checked against white in ./card.test.ts, because
 * a fill that drifts light takes the label's legibility with it"; the parser
 * below built `SKILL_TONES` and then nothing ever asserted on it — ESLint had
 * it flagged as an unused variable. So the guard the comment promised did not
 * exist, and when the tones became `var(--pc-…)` for dark mode the only thing
 * that noticed was the parser throwing.
 *
 * It is live now, and stronger than the comment described: each skill's INK is
 * checked against its own BASE (the pair that actually has to be legible) at
 * the 4.5:1 AA floor, in light AND dark. That is not a hypothetical — Reading
 * failed it at 3.42:1 on the first dark palette, and no choice of base could
 * fix it, which is what forced Reading to stop borrowing `BRAND` and take its
 * own `--pc-read-ink`.
 */
type Tone = { ink: string };

/**
 * `--var: #hex` pairs for one theme, gathered from EVERY matching block.
 *
 * globals.css declares its palettes in several `:root` / `.dark` pairs (the
 * app tokens, the marketing set, the shell, the card), so this collects all of
 * them rather than guessing which block holds a given name. First declaration
 * wins, matching the cascade for equal specificity.
 */
function cssVars(theme: "light" | "dark"): Record<string, string> {
  const selector = theme === "light" ? ":root" : ".dark";
  const out: Record<string, string> = {};
  const blocks = css.matchAll(/(^|\n)(:root|\.dark)\s*\{([^}]*)\}/g);
  for (const b of blocks) {
    if (b[2] !== selector) continue;
    for (const m of b[3].matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/gm)) {
      if (!(m[1] in out)) out[m[1]] = m[2].toLowerCase();
    }
  }
  return out;
}

/** The pill gloss's raw value in `theme` — a shadow list, so `cssVars` (hex
 *  only) cannot read it. */
function pillShadow(theme: "light" | "dark"): string {
  const selector = theme === "light" ? ":root" : ".dark";
  for (const b of css.matchAll(/(^|\n)(:root|\.dark)\s*\{([^}]*)\}/g)) {
    if (b[2] !== selector) continue;
    const m = /^\s*--pc-pill-shadow:\s*([^;]+);/m.exec(b[3]);
    if (m) return m[1];
  }
  throw new Error(`--pc-pill-shadow has no ${theme} value in globals.css`);
}

/** `var(--x)` → its hex in `theme`; a literal hex passes through. */
function resolve(value: string, theme: "light" | "dark"): string {
  const v = value.trim();
  if (v.startsWith("#")) return v.toLowerCase();
  const name = v.match(/^var\((--[a-z0-9-]+)\)$/)?.[1];
  expect(name, `${value} is neither a hex nor a var()`).toBeTruthy();
  const hex = cssVars(theme)[name!];
  expect(hex, `${name} has no ${theme} value in globals.css`).toBeTruthy();
  return hex;
}

const SKILL_TONES: Record<string, Tone> = (() => {
  const at = card.indexOf("const SKILL_TONE: ");
  expect(at, "SKILL_TONE moved or was renamed").toBeGreaterThan(-1);
  const block = card.slice(at, card.indexOf("\n};", at));
  const out: Record<string, Tone> = {};
  for (const m of block.matchAll(/([A-Z]+): \{ ink: "([^"]+)" \}/g)) {
    out[m[1]] = { ink: m[2] };
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
    /* Tokens, not hexes, since dark mode — and in LIGHT they still resolve to
       exactly the `#fff` / `rgba(28,27,46,.09)` this used to assert. What the
       test guards is that the surface is painted in CSS AT ALL: paint it inline
       instead and the stylesheet hover below can never win. */
    expect(declaration(body, "background")).toBe("var(--pc-surface)");
    expect(declaration(body, "border")).toBe("1px solid var(--pc-border)");
  });

  it.each(["light", "dark"] as const)("keeps no skill in the status colours' arc (%s)", (theme) => {
    /* ⚠️ A SKILL WEARING GREEN OR AMBER READS AS A RESULT. The status pill sits
       on the same row and uses green for an earned band and amber for an
       unfinished run, so a skill in either hue says something about the
       learner's work rather than about the content. SKILL_TONE's own comment
       states this rule — it is why Listening is blue and not the obvious teal —
       and nothing was checking it. */
    for (const [skill, tone] of Object.entries(SKILL_TONES)) {
      const h = hue(resolve(tone.ink, theme));
      expect(
        h > 70 && h < 170,
        `${skill} ${theme}: hue ${Math.round(h)}° is in the green arc`,
      ).toBe(false);
      expect(
        h >= 35 && h <= 70,
        `${skill} ${theme}: hue ${Math.round(h)}° is in the amber arc`,
      ).toBe(false);
    }
  });

  it("maps every skill label the three hubs actually pass", () => {
    /* SKILL_FALLBACK's comment says "a test asserts the three hubs' labels all
       land in the map" — it did not. A hub that renames its label silently
       falls back to the brand, so Listening would quietly stop being blue and
       nothing would fail. */
    const labels = skillsPassedByHubs();
    expect(labels.length, "no skill labels found in the hubs — the pattern moved").toBeGreaterThan(
      0,
    );
    for (const label of labels) {
      expect(SKILL_TONES[label.toUpperCase()], `${label} has no entry in SKILL_TONE`).toBeTruthy();
    }
  });

  it.each(["light", "dark"] as const)(
    "keeps every skill label legible on the bare card (%s)",
    (theme) => {
      /* ⚠️ THE GROUND MOVED, SO THIS TEST HAD TO. The label used to sit on a
         filled pill, and the pair that mattered was ink-on-tint. The owner
         asked for plain text, so there is no tint any more and the ink now
         faces the CARD — including the two muted surfaces a finished or locked
         card uses, which are the tightest of the three.

         Losing the fill is exactly what this guards: the fill was doing work
         the type was previously failing to do alone (the original 10px
         #8B919D eyebrow sat near 3:1), so the ink has to carry it now. */
      const surfaces = {
        card: theme === "light" ? "#ffffff" : resolve("var(--tk-panel)", theme),
        finished: resolve("var(--pc-surface-done)", theme),
        locked: resolve("var(--pc-surface-locked)", theme),
      };
      for (const [skill, tone] of Object.entries(SKILL_TONES)) {
        const ink = resolve(tone.ink, theme);
        for (const [name, ground] of Object.entries(surfaces)) {
          expect(
            contrast(ground, ink),
            `${skill} ${theme} on the ${name} surface: ${ink} on ${ground}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
  );

  it("sets no inline border or shadow on the card element itself", () => {
    /* The card's own JSX: `className="pc-card"` and the style object beside it.
       Anything painted there that a :hover rule also sets cancels that hover. */
    const at = card.indexOf('className="pc-card"');
    expect(at, "the card element moved").toBeGreaterThan(-1);
    const element = card.slice(at, card.indexOf(">", at));
    for (const prop of ["border", "borderColor", "boxShadow"]) {
      expect(element.includes(`${prop}:`), `${prop} is inline on .pc-card`).toBe(false);
    }
  });

  it("changes only border-color and box-shadow on hover, never background", () => {
    /* ⚠️ THIS IS WHAT MAKES THE INLINE `background` SAFE. The card paints its
       finished and locked surfaces inline, which is only legitimate while no
       hover rule touches background — the instant one does, every one of those
       cards goes dead under the pointer and nothing else would say so. If this
       fails, the fix is to move the surfaces into CSS, not to delete this. */
    for (const tone of ["brand", "done", "ink"]) {
      const body = ruleBody(`.pc-card[data-tone="${tone}"]:hover`);
      expect(
        declaration(body, "background"),
        `${tone}:hover sets background, which the inline surface would now beat`,
      ).toBeNull();
    }
  });

  it("paints both action pills in CSS, hover included", () => {
    /* Each pill has a resting fill AND a distinct hover fill, both in CSS.
       Asserted as tokens now; every one resolves in light to the hex it used to
       name. The point is that a hover exists and differs from the rest state —
       so the pair is compared, rather than each value pinned. */
    for (const [rest, hover] of [
      [".pc-act--primary", ".pc-act--primary:hover:not(:disabled)"],
      [".pc-act--secondary", ".pc-act--secondary:hover:not(:disabled)"],
      [".pc-act--attach", ".pc-act--attach:hover:not(:disabled)"],
    ]) {
      const a = declaration(ruleBody(rest), "background");
      const b = declaration(ruleBody(hover), "background");
      expect(a, `${rest} has no background`).toBeTruthy();
      expect(b, `${hover} has no background`).toBeTruthy();
      expect(b, `${hover} does not differ from its rest state`).not.toBe(a);
    }
    /* `--tk-brand-fill`, not `--tk-brand`: this pill carries WHITE text, and in
       dark the two are different colours precisely because of that — the fill
       is darker so white clears 4.5:1 on it. Using the plain brand here would
       put white on a 3.81:1 ground. */
    expect(declaration(ruleBody(".pc-act--primary"), "background")).toBe("var(--tk-brand-fill)");
    expect(declaration(ruleBody(".pc-act--secondary"), "background")).toBe("var(--pc-surface)");
    expect(declaration(ruleBody(".pc-act--attach"), "background")).toBe("var(--tk-brand-soft)");
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
    expect(card).toContain('boxShadow: "var(--pc-pill-shadow)"');
    expect(pillShadow("light")).toContain("inset 0 1px 0 rgba(255, 255, 255, 0.9)");
  });

  it("dims that highlight in dark instead of drawing a white rim", () => {
    /* ⚠️ 90% white is a gloss on a pale pill and a bright RIM on a dark one —
       every status pill on the hubs wore a white line across its top in dark
       mode. Dimmed, not dropped: the chip still wants its edge. */
    const alpha = /inset 0 1px 0 rgba\(255, 255, 255, ([\d.]+)\)/.exec(pillShadow("dark"));
    expect(alpha, "the dark pill lost its inset highlight").not.toBeNull();
    expect(Number(alpha![1])).toBeLessThanOrEqual(0.12);
  });

  it("offers the canvas's four states plus the gate", () => {
    /* `locked` is not on the canvas — it had no notion of a paywall — and it is
       the only tone the card adds. Every one of these is about the LEARNER or
       their access; the level is not among them by design (see CardHead). */
    const m = /export type PillTone =([^;]+);/.exec(card);
    expect(m).not.toBeNull();
    const tones = [...m![1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]);
    expect(tones.sort()).toEqual(["band", "locked", "new", "progress", "target"]);
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
  });

  it("carries no border", () => {
    /* The owner's instruction, and the reason is visible: the card already has a
       1px edge, so a second ring 9px inside it reads as a mistake. */
    expect(styleProp(pill, "border"), "the skill pill grew a border").toBeNull();
    expect(styleProp(pill, "borderColor")).toBeNull();
  });

  it("stays FLAT TEXT — no fill, no raise, no letterpress", () => {
    /* ⚠️ THIS TEST IS THE EXACT INVERSE OF THE ONE IT REPLACED, on the owner's
       instruction: "make it simple text, not 3D style". The old version
       asserted the gradient, the inset gloss and the lift were all present,
       because each was load-bearing for a raised chip. None of them may come
       back — and they are the kind of thing that does come back, one
       declaration at a time, when someone decides the label "needs more
       presence". Colour and weight are what carry it now. */
    expect(styleProp(pill, "background"), "the level label grew a fill again").toBeNull();
    expect(styleProp(pill, "boxShadow"), "the level label is raised again").toBeNull();
    expect(styleProp(pill, "textShadow"), "the letterpress came back").toBeNull();
    expect(styleProp(pill, "borderRadius"), "flat text needs no corner radius").toBeNull();
  });

  it("keeps the flat detail chip legible in its own right", () => {
    // Listening's accent chip, on the rare card that still shows one.
    const chip = styleCarrying(fnBody("MonoChip"), "letterSpacing");
    expect(Number(/fontSize: (\d+)/.exec(chip)?.[1])).toBeGreaterThanOrEqual(11);
    expect(styleProp(chip, "color")).toBe("MUTED");
  });

  it("tells the skill chip from the detail chips by its icon", () => {
    /* The icon is what marks the skill chip. It used to be the raise as well;
       now that the label is flat text, the icon is the only marker — so the
       split CardHead makes on `c.icon` is the whole mechanism. */
    const head = fnBody("CardHead");
    expect(head).toContain("chips?.find((c) => c.icon)");
    expect(head).toContain("chips?.filter((c) => !c.icon)");
    expect(head).toContain("<SkillPill");
    expect(head).toContain("<MonoChip");
    expect(fnBody("MonoChip"), "a detail chip is raised too").not.toContain("linear-gradient");
  });

  it("gives the pill to the level and keeps only the skill's colour", () => {
    /* ⚠️ THE HEAD MUST CARRY WHAT VARIES, NOT WHAT IS ALWAYS TRUE. The pill
       used to read "READING" on the Reading hub, where every card does. The
       skill keeps the icon and the colour — enough to identify it — and the
       pill says the level, which is the thing a learner chooses by. */
    const head = fnBody("CardHead");
    expect(head, "the pill no longer shows the level").toContain("label={level?.text}");
    expect(head, "the level's band is no longer a hover away").toContain("hint={level?.hint}");
    expect(head, "the skill still drives the colour").toContain("skill={skill}");
  });
});

// ---- 8. The two states the owner asked to be designed ----------------------

/** A hub's source, comments stripped, for asserting decisions that live there
 *  rather than in the kit. */
function hubSource(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

const READ = hubSource("../../app/(shell)/read/read-hub.tsx");
const WRITE = hubSource("../../app/(shell)/write/library.tsx");
const LISTEN = hubSource("../../app/(shell)/listen/listening-client.tsx");

describe("a locked card is gated, not dimmed", () => {
  it("never fades the whole card", () => {
    /* ⚠️ THE EXACT REGRESSION. `opacity: locked ? 0.66 : 1` on the card fades
       the topic, the level and the question count — the material that makes the
       plan worth buying — and fades the border and shadow with them, so the card
       reads as broken rather than gated. Use the `locked` SURFACE instead. */
    for (const [hub, src] of [
      ["read", READ],
      ["listen", LISTEN],
    ] as const) {
      expect(
        /opacity:[^,}]*locked/.test(src),
        `${hub} dims a locked card again — use surface="locked"`,
      ).toBe(false);
    }
  });

  it("states the gate where the eye looks for state", () => {
    for (const [hub, src] of [
      ["read", READ],
      ["listen", LISTEN],
    ] as const) {
      expect(src, `${hub} has no PRO pill`).toContain('tone="locked"');
      /* ⚠️ THE KEY, NOT THE ENGLISH. These hubs render through `t()` now, so
         asserting the literal "Unlock with Pro" was asserting one locale's copy
         and broke the moment the string moved into the dictionary. The rule —
         a locked card must name what unlocks it — is unchanged, and checking
         the key holds in all three languages instead of only one. */
      expect(src, `${hub} does not name what unlocks it`).toContain("card.unlockPro");
    }
  });

  it("puts the gate ahead of every other state", () => {
    // A locked card cannot be started, so what it scored is not the thing to
    // say about it — the locked branch has to come first.
    /* ⚠️ Match the BRANCH, not the identifier. `locked` also appears in the
       parameter list, which sits before every branch — so searching for the bare
       word made this pass no matter where the check actually ran. */
    const pill = READ.slice(READ.indexOf("function TilePill"));
    const gate = pill.indexOf("if (locked)");
    const paused = pill.indexOf('if (state === "live")');
    expect(gate, "TilePill has no locked branch").toBeGreaterThan(-1);
    expect(paused, "TilePill has no live branch").toBeGreaterThan(-1);
    expect(gate, "a paused locked card reports Paused, not the gate").toBeLessThan(paused);
  });
});

describe("a finished card steps back and leads with the band", () => {
  it("uses the done surface on all three hubs", () => {
    for (const [hub, src] of [
      ["read", READ],
      ["write", WRITE],
      ["listen", LISTEN],
    ] as const) {
      expect(src, `${hub} does not step a finished card back`).toContain('"done" : "open"');
    }
  });

  it("makes reading the feedback the primary action, not sitting it again", () => {
    /* ⚠️ THE DECISION, AND IT INVERTS WHAT WAS THERE. Retake/Rewrite was the
       filled primary and Review/Feedback the quiet secondary, which is backwards
       for work already done — and for Writing it is backwards for the product
       too, since the revision loop is the whole moat. The primary is LAST in the
       footer, so the order swaps with the emphasis. */
    /* Message KEYS rather than English, for the reason given above the
       "Unlock with Pro" check. */
    for (const [hub, src, quiet, loud] of [
      ["read", READ, "card.retake", "card.review"],
      ["write", WRITE, "write.rewrite", "write.feedback"],
    ] as const) {
      const foot = src.slice(src.indexOf("<CardFoot"));
      const quietAt = foot.indexOf(quiet);
      const loudAt = foot.indexOf(loud);
      expect(quietAt, `${hub}: no ${quiet} action`).toBeGreaterThan(-1);
      expect(loudAt, `${hub}: no ${loud} action`).toBeGreaterThan(-1);
      expect(loudAt, `${hub}: ${loud} is not the last (primary) action`).toBeGreaterThan(quietAt);
      // And the one that yields is explicitly the secondary.
      const between = foot.slice(quietAt - 200, quietAt);
      expect(between, `${hub}: ${quiet} is not marked secondary`).toContain('kind="secondary"');
    }
  });
});

// ---- 9. The head says only what varies -------------------------------------

/**
 * ⚠️ THE ROW WAS FIVE THINGS AND THREE OF THEM WERE CONSTANT.
 *
 * "READING" on the Reading hub, "ACADEMIC" when the tab above already said it,
 * and "BRITISH" on all 45 listening items because every prompt in the engine
 * asks for a British voice. Meanwhile the one fact a learner chooses by — how
 * hard it is — was the smallest, flattest chip in the row.
 *
 * None of that shows up as a defect. Each addition looked reasonable on its
 * own; it is only the accumulation that costs, and accumulation is exactly what
 * no test catches unless one is written for it.
 */
describe("nothing in the head is the same on every card", () => {
  it("names the skill without qualifying it", () => {
    /* `label="READING · ACADEMIC"` is how the tail crept in the first time. The
       tab above the grid already separates full tests from single passages, and
       every task type has a tab of its own on Writing. */
    for (const [hub, src] of [
      ["read", READ],
      ["write", WRITE],
    ] as const) {
      for (const m of src.matchAll(/\blabel="([^"]*)"/g)) {
        expect(m[1], `${hub} qualifies the skill in the head: "${m[1]}"`).not.toContain(" · ");
      }
    }
  });

  it("shows listening's accent only when the library has more than one", () => {
    /* Derived, not compared against a hardcoded "British" — that constant lives
       in the other repo (listening/tts.py) and would rot here. The chip returns
       by itself the day a second accent is synthesised. */
    expect(LISTEN, "the accent chip is unconditional again").toContain("showAccent && it.accent");
    expect(LISTEN, "nothing works out whether accents vary").toMatch(
      /accentsVary[\s\S]{0,400}?new Set\(/,
    );
  });

  it("carries the level on every card in all three hubs", () => {
    /* Checked per PROP, not per file. Asserting the helper merely appears
       somewhere passes while a second card beside it hand-builds its own chip —
       which is what an earlier mutation did, and it went straight through. */
    const props = [
      ...[...READ.matchAll(/\blevel=\{([^\n]*)/g)].map((m) => ["read", m[1]] as const),
      ...[...WRITE.matchAll(/\blevel=\{([^\n]*)/g)].map((m) => ["write", m[1]] as const),
      ...[...LISTEN.matchAll(/\blevel=\{([^\n]*)/g)].map((m) => ["listen", m[1]] as const),
    ];
    // Two reading cards (full test + single passage), one writing, one listening.
    expect(props.length, "a card stopped showing its level").toBe(4);
    for (const [hub, value] of props) {
      expect(value, `${hub} formats a level chip of its own: ${value}`).toContain("levelChipFor");
    }
  });

  it("leaves the status pill to the learner, on all three hubs", () => {
    /* ⚠️ Writing kept its pitch here as "Band 5" longest, and it collided with
       the "Band 7.0" the same pill shows once the essay is marked — one word,
       one scale, two unrelated meanings. */
    for (const [hub, src] of [
      ["read", READ],
      ["write", WRITE],
      ["listen", LISTEN],
    ] as const) {
      expect(
        /tone="target">\s*(Band|Level)\s*\{/.test(src),
        `${hub} put the pitch back in the status pill`,
      ).toBe(false);
    }
  });
});
