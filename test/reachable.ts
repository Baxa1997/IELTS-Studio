import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/**
 * Every sibling module `entry` pulls in, following `./` imports only — the set
 * a guard checks when one module must stay out of another's bundle.
 *
 * Only `./x` is followed on purpose: the guards that use this ask what a
 * folder's entry drags in from that same folder. `../` and `@/` imports lead
 * out of it, and a bundle question about them is a different test.
 *
 * ⚠️ `import()` IS NOT FOLLOWED. A dynamic import is the way to keep a module
 * out of the first load, so counting it would fail the guard for exactly the
 * fix it wants.
 */
export function reachableSiblings(dir: string, entry: string): Set<string> {
  const seen = new Set<string>();
  const walk = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const src = readFileSync(join(dir, file), "utf8");
    for (const m of src.matchAll(/from\s+["'](\.\/[^"']+)["']/g)) {
      const base = join(dirname(join(dir, file)), m[1]);
      const hit = [".tsx", ".ts"].map((ext) => base + ext).find((p) => existsSync(p));
      if (hit) walk(relative(dir, hit));
    }
  };
  walk(entry);
  return seen;
}
