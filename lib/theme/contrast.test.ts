import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * EVERY FILL AND THE INK ON IT, CHECKED IN BOTH THEMES.
 *
 * ⚠️ THIS IS THE TEST THAT WOULD HAVE CAUGHT DARK MODE'S WHOLE BUG CLASS. Nine
 * screens shipped with invisible controls — a white "Start mock test", white
 * labels on white chips, black text on black cards — and every one was the same
 * mistake: a fill and the text on it that move in OPPOSITE directions between
 * themes. `background: GREEN` + `color: WHITE` is 5.42:1 in light and 2.33:1 in
 * dark, because GREEN lightens to stay legible as text and white stops clearing
 * it. Nothing about that pair looks wrong in a diff, and it is correct in the
 * theme the author is looking at.
 *
 * THE RULE IS "DARK MUST NOT BE WORSE THAN LIGHT", not a flat floor. A flat
 * floor would relitigate every quiet caption the light design already chose —
 * there are ten pairs under 3:1 in light that are deliberate, and all ten are
 * BETTER in dark. What is never acceptable is a pair that light got right and
 * dark broke. So: dark must reach 4.5:1, or at least match light where light
 * itself is below 4.5.
 */

const ROOT = process.cwd();

/* ── the palettes ─────────────────────────────────────────────────────────
 * globals.css plus lucida.tsx, because the Speaking surface's scale lives in a
 * template literal rather than a stylesheet. */
const css =
  readFileSync(join(ROOT, "app/globals.css"), "utf8") +
  "\n" +
  readFileSync(join(ROOT, "app/(shell)/speak/lucida.tsx"), "utf8");

function vars(theme: "light" | "dark"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const b of css.matchAll(/(^|\n)([.:][^{}\n]*?)\s*\{([^{}]*)\}/g)) {
    if (b[2].includes(".dark") !== (theme === "dark")) continue;
    for (const m of b[3].matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
      if (!(m[1] in out)) out[m[1]] = m[2].trim();
    }
  }
  return out;
}
const LIGHT = vars("light");
const DARK = vars("dark");

/** A colour expression → `#rrggbb`, or null when it is not a flat colour
 *  (a gradient, an rgba, an expression we cannot evaluate). */
function resolve(value: string | undefined, theme: "light" | "dark", depth = 0): string | null {
  if (!value || depth > 6) return null;
  const v = value.trim().replace(/^["'`]|["'`]$/g, "");
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return ("#" + [...v.slice(1)].map((c) => c + c).join("")).toLowerCase();
  }
  const name = /^var\((--[a-z0-9-]+)\)$/.exec(v)?.[1];
  if (!name) return null;
  const table = theme === "dark" ? DARK : LIGHT;
  return resolve(table[name] ?? LIGHT[name], theme, depth + 1);
}

/** The exported token names, so `background: BRAND_FILL` can be evaluated. */
const TOKENS: Record<string, string> = {};
for (const source of ["lib/theme/tokens.ts", "app/_landing/design.ts"]) {
  const src = readFileSync(join(ROOT, source), "utf8");
  for (const m of src.matchAll(/export const ([A-Z_0-9]+) = "([^"]+)";/g)) TOKENS[m[1]] = m[2];
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
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Every balanced `{ … }` in a file, with NESTED blocks blanked out.
 *
 * ⚠️ A SLIDING WINDOW IS NOT GOOD ENOUGH HERE, and the first version of this
 * scan proved it: taking "the next N characters after a background" pairs a
 * card's fill with the colour of whatever object happens to be declared after
 * it, and reported two confident failures that did not exist. A fill and an ink
 * only belong together when they are properties of the SAME object.
 */
function objects(src: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "{") continue;
    let depth = 0;
    let j = i;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) break;
    }
    if (depth !== 0) continue;
    let d = 0;
    let flat = "";
    for (const c of src.slice(i + 1, j)) {
      if (c === "{") d++;
      flat += d ? " " : c;
      if (c === "}") d--;
    }
    out.push(flat);
  }
  return out;
}

/**
 * An identifier → its colour string.
 *
 * ⚠️ A FILE'S OWN BINDING BEATS THE PALETTE'S EXPORT OF THE SAME NAME, and both
 * forms have to be checked: a private `const BODY = "#2a3350"` that shadows the
 * token, and `import { WELL as SOFT }`, where SOFT is WELL and not the SOFT
 * token. Looking at the exports first reported `background: SOFT` as a text
 * colour used as a fill — a false alarm that cost a real investigation.
 */
function expand(expr: string, src: string): string {
  const e = expr.trim();
  // Only a bare identifier can BE a binding; anything else (a literal, a
  // template string, a ternary) is used as written. Checking first also keeps
  // regex metacharacters out of the patterns below, which threw on `"#fff"`.
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(e)) return e;
  const local = new RegExp(`\\bconst ${e}(?:\\s*:\\s*[A-Za-z.<>\\[\\] ]+)?\\s*=\\s*"([^"]+)"`).exec(src);
  if (local) return local[1];
  const alias = new RegExp(`\\b([A-Z_0-9]+) as ${e}\\b`).exec(src);
  if (alias && TOKENS[alias[1]]) return TOKENS[alias[1]];
  return TOKENS[e] ?? e;
}

const FILL = /(?:^|[,{\s])(?:background|backgroundColor)\s*:\s*([^,\n]+?)\s*[,\n]/;
const INK = /(?:^|[,{\s])color\s*:\s*([^,\n]+?)\s*[,\n]/;

interface Finding {
  file: string;
  fill: string;
  ink: string;
  light: number;
  dark: number;
}

function scan(): Finding[] {
  const files = execFileSync("git", ["ls-files", "app", "components"], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f));

  const out: Finding[] = [];
  for (const file of files) {
    const src = readFileSync(join(ROOT, file), "utf8");
    for (const body of objects(src)) {
      const f = FILL.exec(body);
      const i = f && INK.exec(body);
      if (!f || !i) continue;
      const fl = resolve(expand(f[1], src), "light");
      const fd = resolve(expand(f[1], src), "dark");
      const il = resolve(expand(i[1], src), "light");
      const id = resolve(expand(i[1], src), "dark");
      if (!fl || !fd || !il || !id) continue;
      out.push({
        file,
        fill: f[1].trim(),
        ink: i[1].trim(),
        light: contrast(fl, il),
        dark: contrast(fd, id),
      });
    }
  }
  return out;
}

describe("fills and the ink on them", () => {
  const found = scan();

  it("evaluates a meaningful number of pairs", () => {
    // If a refactor moves how styles are written, this scan silently stops
    // finding anything and the suite goes green for the wrong reason.
    expect(found.length).toBeGreaterThan(300);
  });

  it("never lets dark mode be worse than light", () => {
    const regressions = found
      .filter((p) => p.dark < Math.min(p.light, 4.5) - 0.01)
      .map((p) => `${p.file}  ${p.fill} + ${p.ink}: light ${p.light.toFixed(2)} → dark ${p.dark.toFixed(2)}`);
    expect(regressions).toEqual([]);
  });

  it("never puts a literal white on a status or brand fill", () => {
    /* The single most common form of the bug, called out by name because the
       fix is mechanical: every such fill has a paired ink token — GREEN_FILL +
       ON_GREEN, RED_FILL + ON_RED, INDIGO_FILL + ON_INDIGO, BRAND_FILL + WHITE,
       INK + ON_INK. Reaching for the bare colour and WHITE is the mistake. */
    const paired = /^(GREEN|RED|AMBER|INDIGO|INK|SLATE_INK)$/;
    const offenders = found
      .filter((p) => paired.test(p.fill) && /^(WHITE|"#fff"|"#ffffff"|"#FFF"|"#FFFFFF")$/.test(p.ink))
      .map((p) => `${p.file}  background: ${p.fill} + color: ${p.ink} — use ${p.fill}_FILL / ON_${p.fill}`);
    expect(offenders).toEqual([]);
  });
});
