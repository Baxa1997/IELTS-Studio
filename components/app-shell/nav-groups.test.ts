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

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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

describe("the collapsed rail keeps its groups and flies them out", () => {
  const flyout = ".lp-shell-sidebar--collapsed .lp-sb-sub:not(.lp-sb-sub--flat)";

  it("keeps the group row on screen as a centred tile", () => {
    // It used to be `display: none` — the rail flattened into one column of
    // glyphs. The groups stay groups at 72px now.
    const row = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-grouprow");
    expect(declaration(row, "display")).toBeNull();
    // `!important` on both, because the row's inline width and justification
    // are written for the 250px rail — see collapsed-rail.test.ts.
    expect(declaration(row, "justify-content")).toBe("center !important");
    expect(declaration(row, "width")).toBe("auto !important");
  });

  it("anchors the card to the SECTION, not the rail", () => {
    /* ⚠️ THE FAILURE THIS PREVENTS IS SPECTACULAR AND SILENT. `position:
       absolute` resolves against the nearest positioned ancestor; without this
       the nearest one is the rail, so every group's card lands at the same y and
       they stack on top of each other. */
    expect(
      declaration(ruleBody(".lp-shell-sidebar--collapsed .lp-sb-section--group"), "position"),
    ).toBe("relative");
    expect(declaration(ruleBody(flyout), "position")).toBe("absolute");
    expect(declaration(ruleBody(flyout), "left")).toBe("100%");
  });

  it("hides the card with visibility, so its links leave the tab order", () => {
    // `display` cannot be transitioned; `opacity` alone leaves three dozen
    // invisible tab stops in a 72px rail.
    const body = ruleBody(flyout);
    expect(declaration(body, "visibility")).toBe("hidden");
    expect(declaration(body, "transition")).toContain("visibility");
  });

  it("keeps a hover bridge across the rail's own padding", () => {
    /* The rail carries 12px of padding, so the section's right edge sits INSIDE
       the rail's edge. Without padding on the flyout the pointer crosses a dead
       gap between icon and card, the hover drops, and the menu closes under the
       cursor — the classic flyout bug. */
    expect(declaration(ruleBody(flyout), "padding-left")).toBe("20px");
  });

  it("opens on hover AND on focus, or the keyboard cannot reach it", () => {
    const show = ruleBody(
      ".lp-shell-sidebar--collapsed .lp-sb-section--group:hover .lp-sb-sub,\n  .lp-shell-sidebar--collapsed .lp-sb-section--group:focus-within .lp-sb-sub",
    );
    expect(declaration(show, "visibility")).toBe("visible");
    expect(declaration(show, "opacity")).toBe("1");
  });

  it("gives the rows inside their labels back", () => {
    // Every rule above the flyout shrinks a row to its glyph; the card is 206px
    // wide and exists precisely so the labels can be read.
    expect(declaration(ruleBody(`${flyout} .lp-sb-label`), "max-width")).toBe("200px !important");
    expect(declaration(ruleBody(`${flyout} .lp-sb-label`), "opacity")).toBe("1 !important");
    expect(declaration(ruleBody(`${flyout} .lp-sb-link`), "padding")).toBe("7px 9px !important");
  });

  it("leaves the untitled stacks flat, with no phantom card", () => {
    // Assistant and Dashboard have no group row and nothing to fly out.
    const flat = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-sub--flat");
    expect(declaration(flat, "grid-template-rows")).toBe("minmax(0, 1fr) !important");
    expect(declaration(flat, "position")).toBeNull();

    const inner = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-sub--flat .lp-sb-sub-inner");
    expect(declaration(inner, "margin-left")).toBe("0 !important");
    // At 72px a flat row's name is only a `::after` tooltip, drawn outside this
    // box — clipping here slices it off at the rail's edge.
    expect(declaration(inner, "overflow")).toBe("visible !important");
  });

  it("scopes every flyout rule away from the flat stacks", () => {
    /* THE ONE-CHARACTER MISTAKE THIS CATCHES: dropping `:not(.lp-sb-sub--flat)`
       from any of these turns Assistant and Dashboard into a card anchored to a
       group row that does not exist. */
    const collapsed = css.slice(css.indexOf(".lp-shell-sidebar--collapsed .lp-sb-grouprow"));
    const flyoutRules = collapsed
      .split("\n")
      .filter(
        (line) => line.includes(".lp-shell-sidebar--collapsed .lp-sb-sub") && line.includes("{"),
      );
    for (const line of flyoutRules) {
      expect(
        line.includes("--flat"),
        `every collapsed .lp-sb-sub rule must name --flat, either way: ${line.trim()}`,
      ).toBe(true);
    }
    expect(flyoutRules.length).toBeGreaterThan(5);
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

  /**
   * ⚠️ EVERY COMPONENT, NOT JUST THIS ONE.
   *
   * The first version of this guard scanned `sidebar-nav.tsx` alone, because
   * that is where the bug had been found. It then happened a fourth time in
   * `components/practice/gallery.tsx` — written, formatted and shipped in a
   * single session — where the selected filter chip lost BOTH its classes and
   * rendered as bare text. A guard that only watches the file that already
   * burned you is not a guard.
   */
  it("emits no interpolated class anywhere that could have lost its separator", () => {
    /* ⚠️ THE CHECK IS PER INTERPOLATION, AND IT LOOKS AT THE CHARACTER BEFORE IT.
       Two earlier versions of this guard were wrong in opposite directions and
       both looked reasonable:

         1. "is there a quote-then-space anywhere in the interpolation" — the
            BROKEN form satisfies that too (`? "pg-chip--on" : ""` has a closing
            quote followed by a space), so it passed against the very defect it
            was written for.
         2. "every literal must start with a space" — that condemns three
            legitimate shapes: `cn-btn cn-btn--${p ? "primary" : "ghost"}`, where
            the interpolation COMPLETES a class name; `p-1 ${...}`, where the
            static half already ended in a space; and `role === "ignore"`, where
            the literal is a comparison value rather than a class at all.

       What actually distinguishes the bug is the JOIN. If the character
       immediately before `${` is a space, the interpolation starts a fresh class
       and needs no leading space of its own. If it is a hyphen, the
       interpolation is finishing a class name. Only when it is a word character
       — `pg-chip${`, `lp-shell-surface${` — is the next class being welded onto
       the previous one, and only then must every literal begin with a space. */
    const roots = ["app", "components"];
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules") walk(full);
          continue;
        }
        if (!entry.name.endsWith(".tsx")) continue;
        for (const body of classNameTemplates(readFileSync(full, "utf8"))) {
          for (let at = body.indexOf("${"); at !== -1; at = body.indexOf("${", at + 1)) {
            const before = at === 0 ? " " : body[at - 1];
            if (/[\s-]/.test(before)) continue; // starts a class, or finishes one
            const close = body.indexOf("}", at);
            const inside = body.slice(at + 2, close === -1 ? undefined : close);
            for (const literal of inside.match(/"[^"]*"|'[^']*'/g) ?? []) {
              const inner = literal.slice(1, -1);
              if (inner === "" || inner.startsWith(" ")) continue;
              offenders.push(`${full}: ${literal} welded onto \`${body.slice(0, at)}\``);
            }
          }
        }
      }
    };
    for (const r of roots) walk(r);

    expect(offenders, "a class list has lost its separating space").toEqual([]);
  });

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

/**
 * THE INLINE-BACKGROUND TRAP, guarded because it has now bitten three times.
 *
 * Every row in the rail and in the account menu gets its hover from a
 * stylesheet rule — `.lp-sb-item:hover`, `.lp-menu-item:hover`. An inline
 * `background` on the element beats that rule whatever its specificity, and
 * "transparent" beats it just as thoroughly as a colour does. The row then looks
 * completely correct at rest and simply never lights up under the pointer.
 *
 * It is an easy thing to write, because a <button> really does need its user-
 * agent background cleared — and clearing it inline is the obvious move. The
 * reset belongs in the stylesheet, next to the hover it must not cancel.
 *
 * globals.css has carried a note about this for a long time ("Items must NOT set
 * an inline background when resting"). The note did not stop me writing it on
 * the group rows, or on Sign out directly beneath a comment saying not to.
 */
describe("rows keep the hover the stylesheet gives them", () => {
  const shell = readFileSync(fileURLToPath(new URL("./shell.tsx", import.meta.url)), "utf8");

  /* ⚠️ COMMENTS STRIPPED FIRST. This test failed on its own first run by
     matching the words `background: "transparent"` inside the comment warning
     against writing them — the same "a naive search finds its own obituary"
     trap brand-row.test.ts and collapsed-rail.test.ts both already record, now
     in a .tsx rather than a stylesheet. */
  const code = (source: string) =>
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  /** Every inline `background: "transparent"` whose element also carries a class
   *  whose hover lives in CSS. */
  function conflicts(raw: string): string[] {
    const source = code(raw);
    const found: string[] = [];
    const needle = 'background: "transparent"';
    for (let at = source.indexOf(needle); at !== -1; at = source.indexOf(needle, at + 1)) {
      // The element's own JSX, roughly: back to the opening tag, forward a little.
      const from = source.lastIndexOf("<", at);
      const chunk = source.slice(Math.max(0, from), at);
      if (chunk.includes("lp-sb-item") || chunk.includes("lp-menu-item")) {
        found.push(source.slice(Math.max(0, at - 160), at + 40));
      }
    }
    return found;
  }

  it("sets no inline background on anything that hovers from CSS", () => {
    expect(conflicts(nav), "sidebar-nav.tsx").toEqual([]);
    expect(conflicts(shell), "shell.tsx").toEqual([]);
  });

  it("puts the <button> reset in the stylesheet instead", () => {
    // Where the inline value used to be. Both of these are buttons and both need
    // the UA background gone.
    expect(declaration(ruleBody(".lp-sb-grouprow"), "background")).toBe("none");
    expect(declaration(ruleBody(".lp-menu-item"), "background")).toBe("none");
  });

  /**
   * ⚠️ THE COLLAPSED RAIL DOES NOT INHERIT ANY OF IT.
   *
   * `.lp-shell-sidebar--collapsed .lp-sb-link` and `.lp-sb-grouprow` both strip
   * the row's fill with `background: transparent !important` — the row has to
   * lose its pill so the chip can become the 36px tile — and an `!important`
   * declaration beats a non-important one whatever the specificity. So
   * `.lp-sb-item:hover` reaches nothing at 72px, and every hover there has to be
   * re-stated. Miss it and the strip goes dead under the pointer; miss it in the
   * flyout and a real menu does.
   */
  it("re-states the hover at 72px, where !important has cut it off", () => {
    // The bare strip: the row IS the chip, so the fill lands on the chip.
    const strip = ruleBody(
      ".lp-shell-sidebar--collapsed .lp-sb-sub--flat .lp-sb-link:hover .lp-sb-chip,\n  .lp-shell-sidebar--collapsed .lp-sb-grouprow:hover .lp-sb-chip",
    );
    expect(declaration(strip, "background")).toBe("#f0eeea");
  });

  it("hovers the rows inside the flyout card, where they are full rows again", () => {
    const card = ruleBody(
      ".lp-shell-sidebar--collapsed\n    .lp-sb-sub:not(.lp-sb-sub--flat)\n    .lp-sb-link:not(.lp-sb-link--active):hover",
    );
    // `!important` of its own, or the strip's transparent wins.
    expect(declaration(card, "background")).toBe("#f0eeea !important");
  });

  it("leaves the current row alone under the pointer, at every rail width", () => {
    /* Expanded, the active row carries an inline fill that beats the hover rule.
       Collapsed, its tile is `!important` and the chip hover is not. In the
       flyout the active row is EXCLUDED by `:not()` rather than outranked —
       without that it would go LIGHTER on hover than at rest, which reads as
       losing your place. */
    expect(css).toContain(".lp-sb-link:not(.lp-sb-link--active):hover");
    const activeTile = ruleBody(".lp-shell-sidebar--collapsed .lp-sb-link--active .lp-sb-chip");
    // The brand-orange tint (owner, 2026-09-13). What this guards is the
    // `!important`: without it the grey chip hover would replace the active tile.
    expect(declaration(activeTile, "background")).toBe("#fbeae5 !important");
  });

  it("fills the whole row on hover, not a near-invisible wash", () => {
    // The reference is a soft warm grey pill. 5.5% black was not visible.
    for (const selector of [
      ".lp-sb-item:hover",
      ".lp-menu-item:hover",
      ".lp-sb-profile-btn:hover",
    ]) {
      expect(declaration(ruleBody(selector), "background"), selector).toBe("#f0eeea");
    }
  });
});
