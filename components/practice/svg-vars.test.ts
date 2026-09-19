import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A CSS CUSTOM PROPERTY IS NOT VALID IN AN SVG PRESENTATION ATTRIBUTE.
 *
 * `fill="var(--pc-wave)"` does not resolve. The shape renders BLACK, nothing
 * throws, nothing logs, and in light mode on a white card it can even look
 * deliberate. The fix is always the same — move it to `style`, where the
 * cascade does resolve it:
 *
 *     <rect fill="var(--x)" />              ✗ silently black
 *     <rect style={{ fill: "var(--x)" }} /> ✓
 *
 * ⚠️ THIS IS GUARDED BECAUSE IT HAS HAPPENED TWICE, both times to code that had
 * just been converted from a literal to a token — which is exactly when it is
 * easiest to do: the attribute took a hex perfectly well a moment ago. The
 * tokenising codemod deliberately keys on the `:` in a style object so it never
 * touches attributes; these two were written by hand.
 */
const ROOT = process.cwd();
const ATTR = /\b(fill|stroke|stopColor|stop-color|floodColor|flood-color|lightingColor)="var\(--/;

/**
 * THE SAME BUG WEARING A DIFFERENT SPELLING: `stroke={SLATE_STRONG}`.
 *
 * The rule above catches the literal `stroke="var(--x)"`. It does not catch an
 * IDENTIFIER that holds one — and that is the form the bug actually takes when
 * a file is converted, because nobody types `var(` by hand; they swap a hex for
 * the token that replaced it. Six of these were written into the landing demo
 * in one sitting. Identical outcome: the attribute does not resolve, the shape
 * renders black, nothing throws.
 *
 * So this half resolves the identifier. It only flags names it can PROVE hold a
 * var: imported from one of the palette modules, or bound in the file to a
 * `var(--…)` string or to another such name. A prop (`fill={c}`) is not flagged
 * — the caller decides, and the caller is covered wherever it passes a token.
 */
const IDENT_ATTR =
  /\b(fill|stroke|stopColor|stop-color|floodColor|flood-color|lightingColor)=\{([A-Za-z_$][\w$]*)\}/g;

/**
 * And the third spelling: `stroke={accent.track}`.
 *
 * A local palette object whose values are tokens hands the same var() to the
 * same attribute. Four shipped in the plan card and the writing studio, on top
 * of the bare-identifier ones — so this resolves one level of member access
 * against any `const OBJ = { … }` in the file whose values are provably vars.
 * `MAP.ink` in the listening map is NOT flagged, correctly: that object is all
 * hex literals, because the exam map is deliberately fixed in both themes.
 */
const MEMBER_ATTR =
  /\b(fill|stroke|stopColor|stop-color|floodColor|flood-color|lightingColor)=\{([A-Za-z_$][\w$]*)\.([\w$]+)\}/g;

/**
 * Every object KEY in the file that is bound to a var anywhere in it.
 *
 * ⚠️ KEYS, NOT `OBJ.key` PATHS, and the difference is the whole usefulness of
 * this. The real offender was `stroke={accent.color}` where `accent` is
 * `ACCENTS[skill]` — a lookup, not a literal — so resolving the object by name
 * found nothing and the mutation test sailed through. Asking instead "does any
 * object in this file bind `color` to a token?" catches it.
 *
 * It over-approximates on purpose. `MAP.ink` in the listening map is still not
 * flagged (that object is all hex literals, because the exam map is fixed in
 * both themes), and where it does over-reach, the remedy — moving the colour
 * into `style` — is correct for a hex too.
 */
/**
 * Is the attribute at `pos` on a real DOM/SVG element, or on a component?
 *
 * `<Bar fill={a.color} />` is a PROP — Bar puts it in a style object, where a
 * var resolves perfectly well. Only an intrinsic element (lowercase tag) puts
 * the value in an actual presentation attribute, and only there is it broken.
 * Without this the rule reports the plan card's two meter bars, which are fine.
 */
function onIntrinsicElement(line: string, pos: number): boolean {
  const open = line.lastIndexOf("<", pos);
  if (open === -1) return false;
  const name = /^<([A-Za-z][\w.]*)/.exec(line.slice(open));
  return Boolean(name) && /^[a-z]/.test(name![1]);
}

function varKeys(src: string, names: Set<string>): Set<string> {
  const keys = new Set<string>();
  for (const kv of src.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([^,\n}]+)/g)) {
    const v = kv[2].trim();
    if (names.has(v) || /^["'`]var\(--/.test(v)) keys.add(kv[1]);
  }
  return keys;
}
const PALETTES = /@\/lib\/theme\/tokens|@\/app\/_landing\/design|\.\/design/;

/** Names in this file that provably hold a `var(--…)` string. */
function varNames(src: string): Set<string> {
  const names = new Set<string>();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    if (!PALETTES.test(m[2])) continue;
    for (const part of m[1].split(",")) {
      const t = part.trim();
      if (!t) continue;
      // `WELL as SOFT` binds SOFT, not WELL.
      const as = /^(\S+)\s+as\s+(\S+)$/.exec(t);
      names.add(as ? as[2] : t);
    }
  }
  // Locals, including `const EMERALD = SLATE_GREEN` — resolved to a fixed point
  // so a chain of aliases is followed rather than only its first link.
  for (let i = 0; i < 4; i++) {
    for (const m of src.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g)) {
      const rhs = m[2].trim().replace(/;$/, "");
      if (/^["'`]var\(--/.test(rhs) || names.has(rhs)) names.add(m[1]);
    }
  }
  return names;
}

describe("SVG presentation attributes", () => {
  it("never carry a CSS variable", () => {
    const files = execFileSync("git", ["ls-files", "app", "components"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => /\.tsx$/.test(f));

    const offenders: string[] = [];
    for (const file of files) {
      // The rule is documented in prose in a couple of places; a comment
      // quoting the broken form is not the broken form.
      //
      // ⚠️ A BLOCK COMMENT IS REPLACED BY ITS OWN NEWLINES, NOT BY NOTHING.
      // Deleting it outright shifts every line after it, and the guard then
      // reports real offenders at line numbers that point at unrelated code —
      // which is exactly what happened the first time this reported anything.
      const src = readFileSync(join(ROOT, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ""))
        .replace(/\/\/[^\n]*/g, "");
      const named = varNames(src);
      const keys = varKeys(src, named);
      src.split("\n").forEach((line, i) => {
        if (ATTR.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
        for (const m of line.matchAll(IDENT_ATTR)) {
          if (named.has(m[2]) && onIntrinsicElement(line, m.index!)) {
            offenders.push(
              `${file}:${i + 1}  ${m[0]} — ${m[2]} is a var(); move it to style={{ ${m[1]}: ${m[2]} }}`,
            );
          }
        }
        for (const m of line.matchAll(MEMBER_ATTR)) {
          const path = `${m[2]}.${m[3]}`;
          if (keys.has(m[3]) && onIntrinsicElement(line, m.index!)) {
            offenders.push(
              `${file}:${i + 1}  ${m[0]} — ${path} is a var(); move it to style={{ ${m[1]}: ${path} }}`,
            );
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
