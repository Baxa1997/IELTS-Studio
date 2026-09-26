/**
 * The codemod `eslint.config.mjs` promises and nobody wrote.
 *
 * That config scopes its no-raw-hex rule to `shared/components/ui/**` and
 * `shared/components/exam/**` on purpose, and says the glob "grows as
 * `scripts/codemod-tokens.ts` converts the rest, directory by directory". The
 * file it names has never existed in this repo's history, so the glob never
 * grew: `lib/theme/tokens.ts` landed in 5f13197 with 23 files importing it and
 * 62 files still opening with their own `const INDIGO = "…"`.
 *
 * This is that file. It does exactly one narrow, checkable thing:
 *
 *   Replace a private `const INDIGO = "<hex>"` with an import from
 *   `@/lib/theme/tokens` whose value is byte-identical to the hex it replaced.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: change any colour. Four indigos are in
 * circulation and three of them lost, but repainting a screen is a visual
 * decision and this is a mechanical one. Mixing the two would produce a diff no
 * reviewer could check. The value each file renders after this runs is the value
 * it rendered before — `--verify` proves it, and CI can run that.
 *
 * Usage:
 *   npx tsx scripts/codemod-tokens.ts            # report only, writes nothing
 *   npx tsx scripts/codemod-tokens.ts --write    # apply
 *   npx tsx scripts/codemod-tokens.ts --verify   # assert no rendered hex moved
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const TOKENS_MODULE = "@/lib/theme/tokens";

/** The file the tokens live in — it is where literals are allowed, so never touch it. */
const TOKEN_SOURCE = "lib/theme/tokens.ts";

/** `printWidth` from .prettierrc — the emitted import wraps at the same column. */
const PRINT_WIDTH = 100;

/**
 * hex (lowercased) → the token that already holds that exact value.
 * Adding a row here is how you widen the codemod; the value MUST match the
 * token's value in `lib/theme/tokens.ts` or `--verify` fails, which is the point.
 */
const BY_VALUE: Record<string, string> = {
  "#3b43b5": "INDIGO",
  "#4340cb": "INDIGO_CONSOLE",
  "#4338ca": "INDIGO_SHELL",
  "#4f46e5": "INDIGO_STUDIO",
  "#3730a3": "INDIGO_INK",
  // The landing demos kept the name INDIGO when main repainted them burgundy.
  "#7d0132": "BRAND",
};

/**
 * `const INDIGO = "#3B43B5";` / `export const INDIGO_DARK = "#4338CA";`
 *
 * The name pattern is `INDIGO[A-Z_]*`, not a list of known suffixes: the first
 * version of this matched `INDIGO(_DARK)?` and silently walked past
 * `INDIGO_INK`, which the ESLint rule then found. Match the shape, not the
 * names you happen to have seen.
 */
/* The trailing `\n` is part of the match ON PURPOSE: deleting a private const
 * has to take its line break with it, or every converted file keeps a blank line
 * where the declaration used to be. */
const DECL = /^([ \t]*)(export )?const (INDIGO[A-Z_]*) = "(#[0-9a-fA-F]{6})";[ \t]*(\/\/.*)?\n/gm;

interface Change {
  file: string;
  local: string; // the name the file declares (INDIGO, INDIGO_DARK)
  token: string; // the token it will import
  hex: string;
  exported: boolean;
}

function sourceFiles(): string[] {
  // git is the file list: it already knows what is tracked and skips node_modules,
  // .next and anything ignored, without this script re-deriving those rules.
  const out = execFileSync("git", ["ls-files", "app", "shared", "lib"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"))
    .filter((f) => f !== TOKEN_SOURCE);
}

/**
 * Import specifier from `file` to the tokens module, using the `@/` alias the
 * codebase already uses everywhere (tsconfig maps `@/*` to the repo root).
 *
 * Bindings are ALIASED BACK TO THE LOCAL NAME — `INDIGO_CONSOLE as INDIGO` —
 * rather than the call sites being rewritten to the token's name. That is the
 * difference between a diff a reviewer can check (one line changes per file) and
 * one they cannot (every `color: INDIGO` in a 900-line component moves too). It
 * also means a file whose colour is later unified just loses its alias.
 */
function importLine(bindings: string[]): string {
  const one = `import { ${bindings.join(", ")} } from "${TOKENS_MODULE}";`;
  // Match what Prettier would produce, rather than emitting a long line and
  // running `prettier --write` over the file afterwards to fix it. That pass
  // reformats everything ELSE in the file too — on the first run here it turned a
  // 65-line change into an 8,600-line diff, because several of these files had
  // never been formatted. A codemod that needs a formatter to clean up after it
  // cannot be reviewed.
  if (one.length <= PRINT_WIDTH) return one;
  return `import {\n${bindings.map((b) => `  ${b},`).join("\n")}\n} from "${TOKENS_MODULE}";`;
}

/** `INDIGO` when the names agree, `INDIGO_CONSOLE as INDIGO` when they don't. */
function binding(token: string, local: string): string {
  return token === local ? token : `${token} as ${local}`;
}

function plan(): Change[] {
  const changes: Change[] = [];
  for (const file of sourceFiles()) {
    const src = readFileSync(join(ROOT, file), "utf8");
    for (const m of src.matchAll(DECL)) {
      const [, , exported, local, hex] = m;
      const token = BY_VALUE[hex.toLowerCase()];
      // A hex with no token is not a failure — it is a colour nobody has decided
      // on yet. Leave it and say so, rather than inventing a token for it.
      if (!token) continue;
      changes.push({ file, local, token, hex, exported: Boolean(exported) });
    }
  }
  return changes;
}

function apply(changes: Change[]): void {
  const byFile = new Map<string, Change[]>();
  for (const c of changes) byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);

  for (const [file, cs] of byFile) {
    const path = join(ROOT, file);
    let src = readFileSync(path, "utf8");

    src = src.replace(DECL, (line, indent, exported, local, hex) => {
      const c = cs.find((x) => x.local === local && x.hex === hex);
      if (!c) return line;
      // A module that EXPORTS the name keeps exporting it — other files import it
      // from here, and breaking that would turn a colour change into an API change.
      // It just stops being the place the value is written down.
      //
      // `export { INDIGO };` rather than `export const INDIGO = <token>;` because
      // when the token and the local name agree (the 2 files that re-export the
      // winning indigo) the latter is `const INDIGO = INDIGO` — a name colliding
      // with its own import. Re-exporting the imported binding is the one form
      // that works whether or not the names match.
      return c.exported ? `${indent}export { ${local} };\n` : "";
    });

    // Private consts leave a blank line where the declaration was; collapse runs
    // of 3+ newlines that this created, and nothing else.
    src = src.replace(/\n{3,}/g, "\n\n");

    // One import line, merged into an existing tokens import if the file has one.
    //
    // An EXPORTED const keeps its `export const INDIGO = INDIGO_CONSOLE;` line, so
    // it needs the token under its own name. A private one was deleted outright,
    // so it needs the token aliased back to the name the file's body still uses.
    // Exported or private, the binding is the same — the export is a separate
    // `export { … };` line the replacement above already emitted.
    const names = [...new Set(cs.map((c) => binding(c.token, c.local)))];
    const existing = new RegExp(
      `^import \\{([^}]*)\\} from "${TOKENS_MODULE.replace("/", "\\/")}";$`,
      "m",
    );
    const hit = src.match(existing);
    if (hit) {
      // APPEND to the existing list rather than re-sorting it. Sorting looks
      // tidier and costs a bigger diff: in crm-ui.tsx it moved two unrelated
      // bindings, so the reviewer has to check three lines instead of one to see
      // that nothing but the indigo changed. Nothing in the toolchain sorts
      // imports, so the existing order is the author's, and it stays.
      const current = hit[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const merged = [...current, ...names.filter((n) => !current.includes(n))];
      // Keep the shape the author used: a list already broken across lines stays
      // broken, however short the merged form would be.
      const wasMultiline = hit[0].includes("\n");
      src = src.replace(
        existing,
        wasMultiline
          ? `import {\n${merged.map((b) => `  ${b},`).join("\n")}\n} from "${TOKENS_MODULE}";`
          : importLine(merged),
      );
    } else {
      src = insertImport(src, importLine(names));
    }

    writeFileSync(path, src);
  }
}

/**
 * Put the import after the last existing import, so the file keeps whatever
 * import order it had. `"use client"` and `import "server-only"` must stay first,
 * and both are already before any other import in this codebase.
 */
function insertImport(src: string, line: string): string {
  // `[\s\S]` rather than `.` with the `s` flag: a multi-line import must match,
  // and the repo's tsconfig target predates that flag.
  const imports = [...src.matchAll(/^import [\s\S]*?;$/gm)];
  if (imports.length === 0) {
    // No imports at all — go after the directive prologue if there is one.
    const directive = src.match(/^("use client"|"use server");\n/);
    return directive
      ? src.replace(directive[0], `${directive[0]}\n${line}\n`)
      : `${line}\n\n${src}`;
  }
  const last = imports[imports.length - 1];
  const at = last.index! + last[0].length;
  return `${src.slice(0, at)}\n${line}${src.slice(at)}`;
}

/**
 * The safety net: for every file the codemod touched, the colour it renders must
 * be the colour it rendered before. Compares the resolved value of each imported
 * token against the hex recorded in the plan.
 */
function verify(changes: Change[]): number {
  const tokenSrc = readFileSync(join(ROOT, TOKEN_SOURCE), "utf8");
  let bad = 0;
  for (const [hex, token] of Object.entries(BY_VALUE)) {
    const m = tokenSrc.match(new RegExp(`^export const ${token} = "(#[0-9a-fA-F]{6})";`, "m"));
    if (!m) {
      console.error(`  ✗ ${token} is not exported from ${TOKEN_SOURCE}`);
      bad += 1;
    } else if (m[1].toLowerCase() !== hex) {
      console.error(`  ✗ ${token} is ${m[1]}, but the codemod mapped ${hex} onto it`);
      bad += 1;
    }
  }
  const touched = new Set(changes.map((c) => c.file));
  console.log(
    bad === 0
      ? `  ✓ all ${Object.keys(BY_VALUE).length} mappings resolve to their original hex (${touched.size} files)`
      : `  ${bad} mapping(s) drifted`,
  );
  return bad;
}

// ── run ──────────────────────────────────────────────────────────────────────

const write = process.argv.includes("--write");
const verifyOnly = process.argv.includes("--verify");
const changes = plan();

if (verifyOnly) {
  process.exit(verify(changes) === 0 ? 0 : 1);
}

const byToken = new Map<string, number>();
for (const c of changes) byToken.set(c.token, (byToken.get(c.token) ?? 0) + 1);

console.log(
  `${changes.length} declaration(s) in ${new Set(changes.map((c) => c.file)).size} file(s):`,
);
for (const [token, n] of [...byToken].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  → ${token}`);
}

if (!write) {
  console.log("\nreport only — pass --write to apply");
} else {
  apply(changes);
  console.log(`\nwrote ${new Set(changes.map((c) => c.file)).size} file(s)`);
  if (verify(changes) !== 0) process.exit(1);
}
