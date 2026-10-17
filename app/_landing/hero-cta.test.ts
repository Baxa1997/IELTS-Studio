import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CTA_FILL, CTA_LINE, ctaButton, outlineButton } from "./_lib/design";

/**
 * THE FRONT DOOR'S TWO BUTTONS (owner, 2026-10-17): "Start free assessment"
 * filled ORANGE — in light as well as dark, where everything else on the page
 * is burgundy — and "Practise for free" OUTLINED in the same orange.
 *
 * Pinned twice over: in the hero, and in the tokens, whose contrast is checked
 * in BOTH themes, because the orange that reads on a white page is too dark to
 * read on the dark one.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const css = read("app/globals.css");

/** Every custom property set on `:root` (light) or `.dark`, later winning. */
function theme(selector: ":root" | ".dark"): Record<string, string> {
  const out: Record<string, string> = {};
  const head = selector === ":root" ? ":root" : "\\.dark";
  for (const block of css.matchAll(new RegExp(`(?:^|\\n)${head}\\s*\\{([^{}]*)\\}`, "g"))) {
    for (const m of block[1].matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) out[m[1]] = m[2].trim();
  }
  return out;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((acc, c, i) => acc + [0.2126, 0.7152, 0.0722][i] * c, 0);
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const LIGHT = theme(":root");
const DARK = theme(".dark");

describe("the call-to-action tokens", () => {
  const names = ["--mk-cta-fill", "--mk-cta-fill-deep", "--mk-cta-line", "--mk-cta-tint"];

  it("are defined in both themes, as plain colours", () => {
    for (const [name, t] of [
      ["light", LIGHT],
      ["dark", DARK],
    ] as const) {
      for (const n of names) expect(t[n], `${name} ${n}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("fill the button with the same orange in both themes — not light's burgundy", () => {
    expect(LIGHT["--mk-cta-fill"]).toBe(DARK["--mk-cta-fill"]);
    expect(LIGHT["--mk-cta-fill"]).not.toBe(LIGHT["--mk-brand-fill"]);
  });

  it("keep the white label readable on the fill and on its hover, in both themes", () => {
    for (const t of [LIGHT, DARK]) {
      expect(contrast("#ffffff", t["--mk-cta-fill"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast("#ffffff", t["--mk-cta-fill-deep"])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keep the outlined label readable on the page, the well and its own hover, in both themes", () => {
    for (const [name, t] of [
      ["light", LIGHT],
      ["dark", DARK],
    ] as const) {
      for (const ground of ["--mk-panel", "--mk-well", "--mk-cta-tint"]) {
        expect(
          contrast(t["--mk-cta-line"], t[ground]),
          `${name}: outline on ${ground}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("the hero", () => {
  const landing = read("app/_landing/_components/landing-page.tsx");
  const hero = landing.slice(landing.indexOf("function Hero("), landing.indexOf("function Stats("));

  it("fills the start button with the call to action", () => {
    expect(hero).toMatch(
      /className="lp-cta"\s+style=\{\{ \.\.\.ctaButton\(\)[^}]*\}\}\s*>\s*\{t\("lp\.ctaStart"\)\}/,
    );
    expect(ctaButton().background).toBe(CTA_FILL);
  });

  it("outlines the practice button in the same colour", () => {
    expect(hero).toMatch(
      /className="lp-outline"\s+style=\{\{ \.\.\.outlineButton\(\)[\s\S]{0,900}\{t\("lp\.ctaPractice"\)\}/,
    );
    const outline = outlineButton();
    expect(outline.background).toBe("transparent");
    expect(outline.color).toBe(CTA_LINE);
    expect(String(outline.border)).toContain(CTA_LINE);
  });

  it("hovers through the class, with !important — the ground is set inline", () => {
    const chrome = read("app/_landing/_components/design-chrome.tsx");
    expect(chrome).toContain(".lp-cta:hover{background:${CTA_FILL_DEEP}!important}");
    expect(chrome).toContain(".lp-outline:hover{background:${CTA_TINT}!important}");
  });
});
