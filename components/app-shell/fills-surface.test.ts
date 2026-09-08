/**
 * The assistant fills the surface — the whole chain, link by link.
 *
 * This exists because a MISSING SPACE silently disabled the entire thing.
 *
 *     `lp-shell-surface${fills ? "lp-shell-surface--fills" : ""}`
 *
 * When `fills` was true that produced ONE token, `lp-shell-surfacelp-shell-
 * surface--fills`, which matches no rule — so the base class and the modifier
 * both stopped applying at once. Nothing threw, nothing logged, and the page
 * looked exactly like a layout that had never been written: the assistant
 * collapsed to nothing, because `.cn-assistant-page` still picked up its
 * unscoped `height: 0 !important` while the flex parent it needs to grow inside
 * never materialised. The composer went with it.
 *
 * The height here is INHERITED, never guessed — `100%` of a parent that knows
 * its own size, all the way down from the shell surface. That means every link
 * below is load-bearing: break any one and the chain stops there, with the same
 * silent, total failure. jsdom does no layout, so this cannot measure a box.
 * What it can do is assert the chain is unbroken, which is what regressed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const shell = read("./shell.tsx");
const css = read("../../app/globals.css");
const chat = read("../../app/(app)/console/assistant/chat.tsx");

/** Every declaration body written against an exact selector, in source order. */
function ruleBodies(selector: string): string[] {
  const out: string[] = [];
  for (let at = css.indexOf(selector + " {"); at !== -1; at = css.indexOf(selector + " {", at + 1)) {
    const open = css.indexOf("{", at);
    out.push(css.slice(open + 1, css.indexOf("}", open)));
  }
  expect(out.length, `selector not found: ${selector}`).toBeGreaterThan(0);
  return out;
}

/** The single rule for a selector written exactly once. */
function ruleBody(selector: string): string {
  const all = ruleBodies(selector);
  expect(all.length, `expected one rule for ${selector}`).toBe(1);
  return all[0];
}

describe("the surface class list", () => {
  it("separates the modifier from the base class", () => {
    // The bug, stated as the thing it must never be again: the two class names
    // adjacent with no separator anywhere in the file.
    expect(shell).not.toMatch(/lp-shell-surface\$\{[^}]*\?\s*"lp-shell-surface--fills"/);
    // And the shape it must keep: a leading space inside the interpolation.
    expect(shell).toMatch(/\?\s*" lp-shell-surface--fills"/);
  });

  it("still applies the modifier only where the page owns the viewport", () => {
    expect(shell).toMatch(/function fillsTheSurface[\s\S]*?\/console\/assistant/);
  });
});

describe("the height chain", () => {
  it("makes the surface a flex column that does not scroll", () => {
    const body = ruleBody(".lp-shell-surface--fills");
    expect(body).toMatch(/display:\s*flex/);
    expect(body).toMatch(/flex-direction:\s*column/);
    expect(body).toMatch(/overflow:\s*hidden/);
  });

  it("hands the content wrapper whatever the quota bar left over", () => {
    // `>` and not a descendant selector: the quota bar is a SIBLING of the
    // content wrapper, so this must not reach past it.
    const body = ruleBody(".lp-shell-surface--fills > .lp-shell-content");
    expect(body).toMatch(/flex:\s*1/);
    expect(body).toMatch(/min-height:\s*0/);
    expect(body).toMatch(/flex-direction:\s*column/);
  });

  it("passes the height through the console's own two wrappers", () => {
    for (const sel of [".lp-shell-surface--fills .cn-root", ".lp-shell-surface--fills .cn-page"]) {
      const body = ruleBody(sel);
      expect(body, sel).toMatch(/flex:\s*1/);
      expect(body, sel).toMatch(/min-height:\s*0/);
      expect(body, sel).toMatch(/flex-direction:\s*column/);
    }
  });

  it("lets the assistant page fill what is left rather than size to content", () => {
    // `.cn-assistant-page` is written three times and the copies do different
    // jobs, so pick each by what it says rather than by where it sits — a test
    // that grabs "the first one" passes while the layout is broken.
    const all = ruleBodies(".cn-assistant-page");
    const base = all.find((b) => /display:\s*flex/.test(b));
    const desktop = all.find((b) => /!important/.test(b));
    expect(base, "the base rule that stacks header above grid").toBeDefined();
    expect(desktop, "the desktop rule that sizes the stack").toBeDefined();

    expect(base).toMatch(/flex-direction:\s*column/);

    // `height: 0` is not a mistake — with `flex: 1` in a column it is the idiom
    // for "take the leftover space and no more". It is also why the modifier
    // failing was fatal rather than merely untidy: the `height` landed anyway,
    // the `flex` had no column to act in, and the page became 0px tall.
    expect(desktop).toMatch(/flex:\s*1/);
    expect(desktop).toMatch(/height:\s*0\s*!important/);
    expect(desktop).toMatch(/overflow:\s*hidden/);
  });

  it("keeps the desktop-only guard, so a phone still scrolls normally", () => {
    // A fixed frame with a scrolling middle is worth having on a wide screen
    // and hostile on a small one; pinning the chain on a phone would cut a
    // tall page off inside a wrapper that cannot grow.
    const at = css.indexOf(".lp-shell-surface--fills {");
    const query = css.lastIndexOf("@media", at);
    expect(css.slice(query, at)).toMatch(/min-width:\s*901px/);
  });
});

describe("what the chain is for", () => {
  it("scrolls the messages and nothing else", () => {
    expect(chat).toMatch(/className="cn-assistant-messages"[\s\S]{0,120}?overflow:\s*"auto"/);
  });

  it("pins the composer so it cannot leave the screen", () => {
    // The composer is the last child of the conversation column. `flex: "none"`
    // is what keeps it out of the scroll region.
    const at = chat.indexOf("cn-assistant-composer");
    expect(at, "composer not found").toBeGreaterThan(-1);
    expect(chat.slice(at - 400, at + 400)).toMatch(/flex:\s*"none"/);
  });
});

/**
 * WHICH SURFACE A PAGE STANDS ON IS A QUESTION ABOUT THE ROUTE.
 *
 * The chrome — gutter, radius, border, shadow, ground — used to be chosen by
 * `variant`, which the layout computes from `canManagePeople(role)`: true for
 * `center_admin` and `administrator`, false for `teacher`. So a TEACHER on
 * /console got the learner frame around console pages: full-bleed layouts and
 * the console's cream top bar boxed inside a floating white card with a 10px
 * gutter, a border and a shadow. It read as a page cut out and pasted on. The
 * same confusion ran the other way for an owner on /write.
 *
 * Role decides what you may DO. The route decides what the page is DRAWN on.
 */
describe("the surface follows the route, not the role", () => {
  it("derives the console surface from the pathname", () => {
    expect(shell).toMatch(/const consoleSurface = pathname\.startsWith\("\/console"\)/);
  });

  it("counts /admin as a console surface too", () => {
    // The platform console passes variant="console" for its cream ground and
    // zero padding. When this moved from the prop to the route, /admin was left
    // behind and came back as a rounded white card in a gutter, double-inset.
    // Every route that relied on the prop has to be in this list.
    expect(shell).toMatch(/pathname\.startsWith\("\/admin"\)/);
  });

  it("never dresses the surface from the role again", () => {
    // Every chrome property must read `consoleSurface`. `isConsole` (the role)
    // may still exist for other purposes, but not for any of these.
    for (const prop of ["padding", "background", "borderRadius", "border", "boxShadow"]) {
      const m = new RegExp(`${prop}: isConsole`).exec(shell);
      expect(m, `${prop} is still dressed from the role`).toBeNull();
    }
  });

  it("keeps the console flush and the learner page on a card", () => {
    // The two halves of the decision, so a later edit cannot quietly drop one.
    expect(shell).toMatch(/padding: consoleSurface \? 0 : 10/);
    expect(shell).toMatch(/borderRadius: consoleSurface \? 0 : 18/);
    expect(shell).toMatch(/border: consoleSurface \? "none"/);
  });

  it("still skips the content wrapper's padding on console routes", () => {
    // The console owns its own gutters (`.cn-page`); adding the learner
    // wrapper's padding on top double-pads every staff page.
    expect(shell).toMatch(/consoleSurface \|\| ownsTheSurface\(pathname\)/);
  });
});
