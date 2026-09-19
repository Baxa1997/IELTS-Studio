/**
 * The second half of the job `scripts/codemod-tokens.ts` started.
 *
 * That codemod folded private `const INDIGO = "…"` DECLARATIONS into the tokens
 * module. This one goes after the literals that were never declared at all — the
 * `background: "#ffffff"` and `color: "#8b919d"` written straight into a style
 * object, 1,400-odd of them across ~200 files.
 *
 * WHY IT MATTERS NOW. The tokens are `var(--tk-…)` / `var(--mk-…)` since dark
 * mode landed, so a token repaints when `.dark` goes on <html> and a hex does
 * not. Every literal left behind is a spot that stays light-mode-coloured on a
 * dark page — white cards, black text on black. Converting them is what makes
 * dark mode actually cover a screen.
 *
 * THE SAFETY PROPERTY, same as the first codemod: no rendered colour moves in
 * light mode. A literal is only replaced by a token whose `:root` value in
 * globals.css is byte-identical to it, and `--verify` re-derives that mapping
 * from the CSS rather than trusting a table in this file.
 *
 * Usage:
 *   npx tsx scripts/codemod-dark-tokens.ts            # report only, writes nothing
 *   npx tsx scripts/codemod-dark-tokens.ts --write    # apply
 *   npx tsx scripts/codemod-dark-tokens.ts --verify   # assert the mapping is sound
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const PRINT_WIDTH = 100;

/** The two palettes, and the CSS prefix each one's tokens resolve through. */
const PALETTES = [
  { module: "@/lib/theme/tokens", source: "lib/theme/tokens.ts", prefix: "--tk-" },
  { module: "@/app/_landing/design", source: "app/_landing/design.ts", prefix: "--mk-" },
] as const;

type PaletteId = (typeof PALETTES)[number]["module"];

/**
 * Properties whose value is a SURFACE, and properties whose value is INK.
 *
 * ⚠️ THIS SPLIT EXISTS ONLY FOR WHITE, AND IT IS THE WHOLE REASON THIS CODEMOD
 * CANNOT BE A FIND-AND-REPLACE. `#ffffff` is 730 of the literals here and it
 * means two opposite things: the fill of a card, which must go dark, and the ink
 * on a filled burgundy button, which must stay white because the button under it
 * is still burgundy. The declaration it sits in is the only evidence of which
 * one a given literal is, so the property name decides.
 *
 * Every other colour maps the same way regardless of role, so for those this
 * split is inert.
 */
const SURFACE_PROPS = new Set([
  "background",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
]);
const INK_PROPS = new Set([
  "color",
  "fill",
  "stroke",
  "caretColor",
  "textDecorationColor",
  "WebkitTextFillColor",
  "accentColor",
]);

/**
 * `prop: "#hex"` inside a style object — and ONLY that shape.
 *
 * ⚠️ THE `:` IS LOAD-BEARING; IT IS WHAT EXCLUDES SVG PRESENTATION ATTRIBUTES.
 * There are 48 `fill="#fff"` / `stroke="#e6e8ec"` attributes in these files, and
 * a CSS custom property IS NOT VALID in a presentation attribute — `fill="var(
 * --tk-ink)"` does not resolve, it just makes the shape black. Attributes are
 * written with `=`, style-object entries with `:`, so matching the colon leaves
 * the SVG attributes alone. If you ever widen this pattern, widen it away from
 * `=`, and convert those shapes by moving them into a `style` prop instead.
 */
const ENTRY = /\b([A-Za-z][A-Za-z0-9]*)(\s*:\s*)"(#[0-9a-fA-F]{3,8})"/g;

/** `#abc` → `#aabbcc`, so short and long forms compare equal. */
function expand(hex: string): string {
  const h = hex.toLowerCase();
  if (h.length === 4) return "#" + [...h.slice(1)].map((c) => c + c).join("");
  return h;
}

/** Read the `:root` block of globals.css into `--var` → `#hex`. */
function lightValues(): Map<string, string> {
  const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  const out = new Map<string, string>();
  for (const m of css.matchAll(/^\s*(--(?:tk|mk)-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/gm)) {
    // `:root` comes before `.dark` in the file, so the FIRST value wins and the
    // dark override never overwrites it.
    if (!out.has(m[1])) out.set(m[1], expand(m[2]));
  }
  return out;
}

/**
 * Per palette: `#hex` → exported token name, derived by reading the palette
 * module for `NAME = "var(--x)"` and looking `--x` up in globals.css. Nothing is
 * hard-coded, so the table cannot drift from the CSS the app actually paints.
 */
function tokensByValue(): Map<PaletteId, Map<string, { surface: string; ink: string }>> {
  const light = lightValues();
  const out = new Map<PaletteId, Map<string, { surface: string; ink: string }>>();

  for (const p of PALETTES) {
    const src = readFileSync(join(ROOT, p.source), "utf8");
    const byHex = new Map<string, { surface: string; ink: string }>();
    for (const m of src.matchAll(/export const ([A-Z_0-9]+) = "var\((--[a-z0-9-]+)\)";/g)) {
      const hex = light.get(m[2]);
      if (!hex || !m[2].startsWith(p.prefix)) continue;
      // First name wins: the modules declare their primary name before any alias.
      if (!byHex.has(hex)) byHex.set(hex, { surface: m[1], ink: m[1] });
    }
    // WHITE is the one token that is still a literal, and it is the INK half of
    // the pair whose SURFACE half is PANEL. Both are #ffffff in light mode.
    const white = byHex.get("#ffffff");
    byHex.set("#ffffff", { surface: white?.surface ?? "PANEL", ink: "WHITE" });
    out.set(p.module, byHex);
  }
  return out;
}

function sourceFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "app", "components"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f))
    .filter((f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
    .filter((f) => f !== "app/_landing/design.ts");
}

/**
 * Which palette a file belongs to.
 *
 * An existing import is the strongest evidence and is trusted first — a file
 * already drawing from `design.ts` must keep drawing from it, or it ends up
 * wearing the app's violet greys next to the marketing site's slate ones. Only
 * a file that imports neither is placed by path.
 */
function paletteFor(file: string, src: string): PaletteId | null {
  if (/from "@\/app\/_landing\/design"|from "\.\/design"|from "\.\.\/design"/.test(src)) {
    return "@/app/_landing/design";
  }
  if (/from "@\/lib\/theme\/tokens"/.test(src)) return "@/lib/theme/tokens";
  const marketing =
    file.startsWith("app/_landing/") ||
    file.startsWith("app/(marketing)/") ||
    file.startsWith("app/(legal)/") ||
    file.startsWith("app/how-to-use/") ||
    file === "app/page.tsx";
  return marketing ? "@/app/_landing/design" : "@/lib/theme/tokens";
}

interface FileChange {
  file: string;
  palette: PaletteId;
  /** `[token, localName]` — equal unless the name was already taken. */
  added: [string, string][];
  count: number;
  next: string;
}

/**
 * Names the file ALREADY binds: its own `const MUTED = …`, and anything it
 * imports from somewhere else.
 *
 * ⚠️ WITHOUT THIS THE CODEMOD CHANGES COLOURS INSTEAD OF PRESERVING THEM, which
 * is the one thing it promises not to do. Several console screens import `MUTED`
 * and `FAINT` from `components/console/page-ui`, whose values are its own
 * (`var(--pu-muted, #5A6076)`) and are NOT the token values. Rewriting a literal
 * `#6E6C87` to a bare `MUTED` in such a file does not resolve to the token — it
 * resolves to page-ui's grey, and the screen quietly repaints. TypeScript
 * catches the import clash but not the local-const one, so neither can be
 * relied on to notice.
 */
function boundNames(src: string): Set<string> {
  const names = new Set<string>();
  for (const m of src.matchAll(/^(?:export )?const ([A-Z_0-9]+)\s*[:=]/gm)) names.add(m[1]);
  for (const m of src.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from/g)) {
    for (const part of m[1].split(",")) {
      const n = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (n) names.add(n);
    }
  }
  return names;
}

function plan(): { changes: FileChange[]; skipped: Map<string, number> } {
  const tables = tokensByValue();
  const changes: FileChange[] = [];
  const skipped = new Map<string, number>();

  for (const file of sourceFiles()) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const palette = paletteFor(file, src);
    if (!palette) continue;
    const table = tables.get(palette)!;

    const taken = boundNames(src);
    const alias = new Map<string, string>();
    /** The local name to use for `token` in this file — aliased if it collides. */
    const localFor = (token: string): string => {
      const existing = alias.get(token);
      if (existing) return existing;
      // `TK_` rather than a number suffix: the reader needs to see AT THE CALL
      // SITE that this one came from the palette and the bare name beside it did
      // not, because the two are different colours.
      const name = taken.has(token) ? `TK_${token}` : token;
      alias.set(token, name);
      return name;
    };

    const added = new Map<string, string>();
    let count = 0;
    const next = src.replace(ENTRY, (whole, prop: string, sep: string, hex: string) => {
      const pair = table.get(expand(hex));
      if (!pair) {
        // Not a token value. That is a colour nobody has decided on yet, not a
        // failure — leave it and report it.
        skipped.set(expand(hex), (skipped.get(expand(hex)) ?? 0) + 1);
        return whole;
      }
      let name: string;
      if (SURFACE_PROPS.has(prop)) name = pair.surface;
      else if (INK_PROPS.has(prop)) name = pair.ink;
      else {
        // A property this script has no opinion about (boxShadow, a custom
        // property, something new). Only safe when both roles agree, which is
        // every colour except white.
        if (pair.surface !== pair.ink) {
          skipped.set(expand(hex), (skipped.get(expand(hex)) ?? 0) + 1);
          return whole;
        }
        name = pair.surface;
      }
      const local = localFor(name);
      added.set(name, local);
      count++;
      return `${prop}${sep}${local}`;
    });

    if (count > 0) changes.push({ file, palette, added: [...added], count, next });
  }
  return { changes, skipped };
}

/** Merge the needed names into the file's existing import from that module, or
 *  add one after the last import if there is none. */
function withImports(src: string, palette: PaletteId, pairs: [string, string][]): string {
  const names = pairs.map(([token, local]) => (token === local ? token : `${token} as ${local}`));
  const spec = palette === "@/lib/theme/tokens" ? palette : "(?:@/app/_landing/design|\\./design)";
  const re = new RegExp(`import \\{([^}]*)\\} from "(${spec})";`);
  const m = src.match(re);

  if (m) {
    const have = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = [...new Set([...have, ...names.filter((n) => !have.includes(n))])].sort();
    if (merged.length === have.length) return src;
    const one = `import { ${merged.join(", ")} } from "${m[2]}";`;
    const line =
      one.length <= PRINT_WIDTH
        ? one
        : `import {\n${merged.map((b) => `  ${b},`).join("\n")}\n} from "${m[2]}";`;
    return src.replace(re, line);
  }

  const one = `import { ${[...names].sort().join(", ")} } from "${palette}";`;
  const line =
    one.length <= PRINT_WIDTH
      ? one
      : `import {\n${[...names]
          .sort()
          .map((b) => `  ${b},`)
          .join("\n")}\n} from "${palette}";`;
  const lines = src.split("\n");
  // ⚠️ TRACK BRACE DEPTH — "the last line starting with `import`" IS NOT THE END
  // OF THE IMPORTS. A multi-line `import {\n  A,\n} from "x";` has its `import`
  // on the first line, so that naive rule inserts the new statement BETWEEN the
  // brace and its members, producing `import {` / `import { PANEL } from …` /
  // `  refreshInvite,`. It is a syntax error, and it happened in 10 files.
  let depth = 0;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith("import ") && depth === 0) continue;
    depth += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length;
    if (depth <= 0 && l.trimEnd().endsWith(";")) {
      end = i;
      depth = 0;
    }
  }
  if (end === -1) {
    // No imports at all: go after the leading block comment / "use client".
    const at = lines.findIndex((l, i) => i > 0 && l.trim() === "" && lines[i - 1].includes("*/"));
    lines.splice(at === -1 ? 0 : at, 0, "", line);
  } else {
    lines.splice(end + 1, 0, line);
  }
  return lines.join("\n");
}

function main() {
  const write = process.argv.includes("--write");
  const verify = process.argv.includes("--verify");
  const { changes, skipped } = plan();

  if (verify) {
    // The mapping is derived from globals.css, so "sound" means: every token a
    // replacement would use still resolves to the literal it replaced.
    const light = lightValues();
    let bad = 0;
    for (const p of PALETTES) {
      const src = readFileSync(join(ROOT, p.source), "utf8");
      for (const m of src.matchAll(/export const ([A-Z_0-9]+) = "var\((--[a-z0-9-]+)\)";/g)) {
        if (!m[2].startsWith(p.prefix)) continue;
        if (!light.has(m[2])) {
          console.error(`  ✗ ${p.source}: ${m[1]} → ${m[2]} has no :root value in globals.css`);
          bad++;
        }
      }
      // Rule 1 from globals.css: every token needs a value in BOTH blocks.
      const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
      const darkBlock = css.slice(css.indexOf(".dark {", css.indexOf(p.prefix)));
      for (const v of light.keys()) {
        if (!v.startsWith(p.prefix)) continue;
        if (!darkBlock.includes(`${v}:`) && !css.includes(`\n  ${v}:`)) {
          console.error(`  ✗ ${v} has no dark value`);
          bad++;
        }
      }
    }
    console.log(
      bad === 0
        ? "✓ mapping sound: every token resolves to its light literal"
        : `✗ ${bad} problems`,
    );
    process.exit(bad === 0 ? 0 : 1);
  }

  const total = changes.reduce((n, c) => n + c.count, 0);
  for (const c of changes.sort((a, b) => b.count - a.count).slice(0, 25)) {
    const shown = c.added.map(([t, l]) => (t === l ? t : `${t} as ${l}`));
    console.log(`  ${String(c.count).padStart(4)}  ${c.file}  (+${shown.join(", ")})`);
  }
  console.log(`\n${total} literals in ${changes.length} files`);

  const left = [...skipped.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`${left.reduce((n, [, c]) => n + c, 0)} literals left (no token holds that value):`);
  for (const [hex, n] of left.slice(0, 12)) console.log(`  ${hex}  ×${n}`);

  if (!write) {
    console.log("\n(report only — pass --write to apply)");
    return;
  }
  for (const c of changes) {
    writeFileSync(join(ROOT, c.file), withImports(c.next, c.palette, c.added), "utf8");
  }
  console.log(`\nwrote ${changes.length} files`);
}

main();
