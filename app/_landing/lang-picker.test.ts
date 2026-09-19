import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * THE LANGUAGE SWITCH, AND THE THREE WAYS IT FELT BROKEN.
 *
 * All three were reported as one complaint — "switching is too heavy and the
 * options do not always click" — and none of them was a click being lost in the
 * way that phrase suggests:
 *
 *   1. nothing moved when you chose. On a route whose language is in the URL,
 *      a click only STARTED a navigation: the tick stayed where it was and the
 *      page stayed in the old language until the server answered. That reads as
 *      a dead control, and a dead control gets clicked again;
 *   2. the tab locked up while it answered. `router.refresh()` re-runs every
 *      server component on the route — Supabase round trips included — and
 *      outside a transition React treats that as urgent work;
 *   3. the menu could open below the fold. It was pinned a fixed 48px under the
 *      button, and in the mobile drawer — which also locks body scrolling —
 *      that put rows somewhere you could see but not reach.
 *
 * These are source scans because what they pin is a DECISION, not a rendered
 * result: jsdom has no layout, so it cannot tell you the menu went off-screen,
 * and it cannot tell a transition from a blocking update either.
 */

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const picker = read("./lang-picker.tsx");
const provider = read("../../components/i18n/locale-provider.tsx");

describe("the language picker", () => {
  it("dismisses on pointerdown, not on the mouse compatibility layer", () => {
    /* A finger and a pen raise pointer events; the mouse events that follow are
       synthesised, and may be coalesced, delayed, or skipped entirely. */
    expect(picker).toContain('addEventListener("pointerdown"');
    expect(picker, "mousedown is the compatibility layer").not.toContain(
      'addEventListener("mousedown"',
    );
  });

  it("places the menu against the button rather than at a fixed offset", () => {
    expect(picker, "a hardcoded px offset cannot know where the viewport ends").not.toMatch(
      /top:\s*compact\s*\?\s*\d+\s*:\s*\d+/,
    );
    expect(picker).toContain("calc(100% + 6px)");
  });

  it("can open upwards when there is no room below", () => {
    expect(picker).toMatch(/dropUp/);
    expect(picker).toContain("getBoundingClientRect");
    expect(picker).toContain("window.innerHeight");
  });

  it("opts taps out of the double-tap wait", () => {
    // ~300ms of held-back tap is long enough for a scroll to steal it.
    expect(picker).toContain('touchAction: "manipulation"');
  });

  it("warms the other languages' URLs before they are needed", () => {
    expect(picker).toContain("prefetchLocales");
  });
});

describe("changing the language", () => {
  it("applies the choice locally before the server answers", () => {
    /* The regression this exists for: on a pinned route the URL owns the
       language, so without a local claim the interface could not change at all
       until the navigation landed. */
    expect(provider).toMatch(/setChosen\(\{ value: l, against: pin \}\)/);
    expect(provider).toMatch(/const locale = claimed \?\? pin \?\? fromCookie/);
  });

  it("expires that claim by derivation, not by a second render", () => {
    expect(provider).toMatch(/chosen\.against === pin/);
    expect(provider, "resetting from an effect costs an extra render pass").not.toMatch(
      /useEffect\(\s*\(\)\s*=>\s*\{\s*setChosen\(null\)/,
    );
  });

  it("does the server half in a transition", () => {
    expect(provider).toContain("useTransition");
    expect(provider).toMatch(/startTransition\(\(\) => \{[\s\S]{0,200}router\.(push|refresh)/);
  });

  it("tells the chrome that the server half is still in flight", () => {
    expect(provider).toMatch(/pending,\s*prefetchLocales/);
  });
});
