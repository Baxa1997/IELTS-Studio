/**
 * The rail's collapsible groups, guarded where they fail SILENTLY.
 *
 * Three of the four things below break without an error, without a type
 * failure, and without a rendering exception — the rail just stops working, and
 * only on screen:
 *
 *   1. `grid-template-rows: 0fr` with the default `auto` minimum never shuts.
 *      The group animates to a height it refuses to go below, so a "closed"
 *      group stays open at full height and the chevron points the wrong way.
 *   2. `overflow: hidden` on the inner wrapper is what makes the tween possible
 *      at 250px and what SLICES THE TOOLTIP OFF at 72px, where the row's name
 *      exists only as a `::after` drawn outside that box.
 *   3. If the group row survives into the collapsed rail, it is a button whose
 *      contents are hidden by a different mechanism — you press it and nothing
 *      happens — and every nested destination becomes unreachable at 72px.
 *
 * jsdom does no layout, so none of this can be measured. What can be asserted is
 * that the specific declarations each fix turns on are still present, which is
 * the thing that actually regresses.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** DECLARATIONS ONLY — globals.css quotes the values it replaced in its own
 *  comments, and a naive search finds its own obituary (see brand-row.test.ts). */
const css = readFileSync(
  fileURLToPath(new URL("../../app/globals.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

const nav = readFileSync(fileURLToPath(new URL("./sidebar-nav.tsx", import.meta.url)), "utf8");

function ruleBody(selector: string): string {
  const at = css.indexOf(selector + " {");
  expect(at, `selector not found: ${selector}`).toBeGreaterThan(-1);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function declaration(body: string, prop: string): string | null {
  const m = new RegExp(`(?:^|;|\\n)\\s*${prop}\\s*:([^;]+);`).exec(body);
  return m ? m[1].trim() : null;
}

describe("a group opens and shuts to its own height", () => {
  it("tweens the grid row rather than a guessed max-height", () => {
    // A max-height has to be guessed: too small clips the last row, too large
    // spends most of the duration animating empty space.
    const sub = ruleBody(".lp-sb-sub");
    expect(declaration(sub, "display")).toBe("grid");
    expect(declaration(sub, "transition")).toContain("grid-template-rows");
  });

  it("pins the row's minimum to zero, or it never actually closes", () => {
    // THE BUG THIS WHOLE TEST FILE EXISTS FOR. A grid row's default minimum is
    // `auto`, which refuses to shrink below the content — `0fr` alone does
    // nothing and the group stays open at full height.
    const shut = ruleBody('.lp-sb-sub[data-open="0"]');
    expect(declaration(shut, "grid-template-rows")).toBe("minmax(0, 0fr)");
    expect(declaration(ruleBody(".lp-sb-sub"), "grid-template-rows")).toBe("minmax(0, 1fr)");
  });

  it("clips in the inner wrapper, which carries no vertical margin", () => {
    // An overflow-hidden box still reserves its own margin at 0fr, so the group
    // would never quite shut — a few pixels of gap left behind every time.
    const inner = ruleBody(".lp-sb-sub-inner");
    expect(declaration(inner, "overflow")).toBe("hidden");
    expect(declaration(inner, "margin-left")).toBe("21px");
    expect(inner).not.toMatch(/margin-(top|bottom)\s*:/);
  });
});

describe("the collapsed rail flattens the disclosures away", () => {
  it("hides the group row, which cannot work at 72px", () => {
    const row = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-grouprow");
    expect(declaration(row, "display")).toBe("none !important");
  });

  it("forces every group open, so nothing is unreachable at 72px", () => {
    // With the parent row hidden, a shut group's destinations would have no
    // route to them at all.
    const sub = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-sub");
    expect(declaration(sub, "grid-template-rows")).toBe("minmax(0, 1fr) !important");
  });

  it("lets the hover tooltip escape the clip", () => {
    // At 72px the row's name exists ONLY as a `::after` beside the glyph,
    // outside the wrapper that clips the tween. Hidden here and it is sliced
    // off at the rail's edge — the same trade `.lp-sb-scroll` makes above it.
    for (const selector of [
      ".lp-shell-sidebar--collapsed .lp-sb-sub",
      ".lp-shell-sidebar--collapsed .lp-sb-sub-inner",
    ]) {
      expect(declaration(ruleBody(selector), "overflow")).toBe("visible !important");
    }
  });

  it("drops the indent, so the glyphs line up in one column", () => {
    const inner = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-sub-inner");
    expect(declaration(inner, "margin-left")).toBe("0 !important");
    expect(declaration(inner, "padding-left")).toBe("0 !important");
    expect(declaration(inner, "align-items")).toBe("center");
  });
});

describe("the rail's state survives a reload without breaking hydration", () => {
  it("reads the preference through useSyncExternalStore, not in render or an effect", () => {
    // Reading localStorage during render is a hydration mismatch (the server has
    // none); reading it in an effect is a cascading render on every page. The
    // hook exists for exactly this shape.
    expect(nav).toContain("useSyncExternalStore");
    expect(nav).toContain("function serverOpenGroups");
  });

  it("returns a stable snapshot, not a fresh object every render", () => {
    // `getSnapshot` is called on every render and compared with Object.is. A
    // fresh JSON.parse is a new object each time and loops forever.
    const at = nav.indexOf("function readOpenGroups");
    const body = nav.slice(at, nav.indexOf("}", nav.indexOf("catch", at)));
    expect(body).toContain("getItem(OPEN_KEY)");
    expect(body).not.toContain("JSON.parse");
  });

  it("notifies its own subscribers on write", () => {
    // The `storage` event does NOT fire in the tab that wrote it, so a toggle
    // would persist but not repaint anywhere else the rail is mounted.
    const at = nav.indexOf("function writeOpenGroups");
    expect(nav.slice(at, at + 600)).toContain("for (const listener of openStoreListeners)");
  });
});

describe("a shut group still says what is waiting behind it", () => {
  it("rolls its children's badges up onto the group row", () => {
    // Unfinished homework and unopened marking are the two things the rail
    // exists to surface; a disclosure that can hide them is a regression.
    expect(nav).toContain("function groupBadge");
    expect(nav).toMatch(/const rollup = section\.title && !open \? groupBadge/);
  });

  it("escalates the tone, because 'someone is waiting on you' outranks a list", () => {
    const at = nav.indexOf("function groupBadge");
    expect(nav.slice(at, at + 700)).toContain('badged.some((i) => i.badgeTone === "alert")');
  });
});

/**
 * THE FORMATTER BUG, GUARDED AT THE SOURCE.
 *
 * A class list written as `` `a${cond ? " b" : ""}` `` depends on a SPACE INSIDE
 * A STRING LITERAL to separate two class names, and `prettier --write` removes
 * it. The result compiles, type-checks, renders and passes every other test — it
 * just concatenates into one token that matches no rule, so both the base class
 * and the modifier silently stop applying.
 *
 * It has happened three times in this folder: it put a 21px indent and a guide
 * line under Assistant and Dashboard, and switched off the collapsed rail's
 * active tile and the Assistant's animation. The fix is to build the list from
 * arguments, where the separator is code rather than string content.
 */
/**
 * THE FORMATTER BUG, GUARDED AT THE SOURCE.
 *
 * A class list written as `` `a${cond ? " b" : ""}` `` depends on a SPACE INSIDE
 * A STRING LITERAL to separate two class names, and `prettier --write` removes
 * it. The result compiles, type-checks, renders and passes every other test — it
 * just concatenates into one token that matches no rule, so both the base class
 * and the modifier silently stop applying.
 *
 * It has happened three times in this folder: it put a 21px indent and a guide
 * line under Assistant and Dashboard, and switched off the collapsed rail's
 * active tile and the Assistant's animation. The fix is to build the list from
 * arguments, where the separator is code rather than string content.
 */
describe("class lists survive the formatter", () => {
  /** Every `className={`…`}` template literal in the file. */
  function classNameTemplates(source: string): string[] {
    const out: string[] = [];
    const marker = "className={`";
    for (let at = source.indexOf(marker); at !== -1; at = source.indexOf(marker, at + 1)) {
      const open = at + marker.length;
      const close = source.indexOf("`", open);
      if (close !== -1) out.push(source.slice(open, close));
    }
    return out;
  }

  it("emits no interpolated class that could have lost its separator", () => {
    /* ⚠️ THE CHECK HAS TO LOOK IN BOTH BRANCHES OF THE TERNARY, which is what the
       first version of this test got wrong: it only matched `cond ? " lp-…"` and
       the real code put the class in the FALSE branch (`cond ? "" : "lp-…"`), so
       it passed against the exact bug it was written for.

       Looking for the class name in one branch or the other is a game of
       whack-a-mole anyway. The invariant is simpler: once a template literal has
       opened an interpolation, ANY class name it contributes must begin with a
       space, so a bare `"lp-` after the first `${` is the defect — whichever
       branch it sits in. */
    for (const body of classNameTemplates(nav)) {
      const firstInterpolation = body.indexOf("${");
      if (firstInterpolation === -1) continue;
      const interpolated = body.slice(firstInterpolation);
      expect(
        interpolated.includes('"lp-') || interpolated.includes("'lp-"),
        `class list has lost its separating space: \`${body}\``,
      ).toBe(false);
    }
  });

  it("builds the rail's conditional classes with cx()", () => {
    expect(nav).toContain("function cx(");
    for (const cls of ["lp-sb-sub--flat", "lp-sb-link--active", "lp-sb-ai"]) {
      // Passed as an argument, so the separator is code and not string content.
      expect(nav, `${cls} should be a cx() argument`).toMatch(
        new RegExp(`&&\\s*"${cls.replace(/-/g, "\\-")}"`),
      );
    }
  });

  it("still separates the classes it joins", () => {
    // cx() is only a fix if it joins with a space.
    const at = nav.indexOf("function cx(");
    expect(nav.slice(at, at + 240)).toContain('.join(" ")');
  });
});
