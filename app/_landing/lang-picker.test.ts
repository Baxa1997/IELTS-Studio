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
 *      a dead control, and a dead control gets clicked again. The first fix for
 *      this — change the chrome immediately and let the page catch up — was
 *      REJECTED after use: it made one click produce two visible changes, and
 *      put a page in two languages on screen in between. A loader over the
 *      whole page and one change at the end is what replaced it;
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
  it("does NOT apply the choice until the server half has arrived", () => {
    /* ⚠️ THE REGRESSION IS THE OPTIMISTIC SWITCH, NOT ITS ABSENCE. Applying the
       choice on click was tried, shipped and taken back out: the header flipped
       at once and the page under it stayed in the old language for as long as
       the server took, which is two changes for one click with a
       half-translated page in between. Precedence is the URL, then the cookie —
       and nothing local in front of either. */
    expect(provider).toMatch(/const locale = pin \?\? fromCookie/);
    expect(provider, "a local claim is back in the precedence chain").not.toMatch(
      /const locale = \w+ \?\? pin \?\? fromCookie/,
    );
  });

  it("publishes the new locale only once the transition has landed", () => {
    /* The store is what every client component reads, and a store update is
       urgent by definition — React cannot defer it into the transition. So it
       is written when the transition STOPS pending, which is the one moment
       both halves are ready. */
    expect(provider).toMatch(
      /if \(pending \|\| switchingTo === null \|\| cached === switchingTo\)/,
    );
    expect(provider).toMatch(/cached = switchingTo;[\s\S]{0,120}listeners/);
  });

  it("does the server half in a transition", () => {
    expect(provider).toContain("useTransition");
    expect(provider).toMatch(/startTransition\(\(\) => \{[\s\S]{0,200}router\.(push|refresh)/);
  });

  it("covers the whole page while it travels", () => {
    // Not a spinner in the menu — the menu is shut by then. The loader is the
    // provider's, so every surface with a provider gets it for free.
    expect(provider).toContain("LanguageSwitchOverlay");
    expect(provider).toMatch(/position: "fixed"/);
    expect(provider).toMatch(/inset: 0/);
    expect(provider).toMatch(/\{pending \? <LanguageSwitchOverlay/);
  });

  it("puts that loader above the dialogs it can be opened from", () => {
    const z = /zIndex: (\d+)/.exec(provider.slice(provider.indexOf("LanguageSwitchOverlay")));
    expect(Number(z?.[1] ?? 0)).toBeGreaterThan(1000);
  });
});
