import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Every file under `roots` that is on disk right now, tracked or not — the list
 * the source-scanning guards walk.
 *
 * ⚠️ WHY NOT PLAIN `git ls-files`. That reads the INDEX, not the disk, and the
 * two disagree whenever work is not yet staged:
 *
 *  - a file created or moved but not yet `git add`ed is missing, so a guard
 *    built on it passes while scanning none of it. When `components/` moved to
 *    `shared/components/` (2026-09-26), five guards would have scanned none of
 *    the moved files and stayed green until somebody staged them;
 *  - a file deleted but not yet staged is still listed, so the guard crashes on
 *    the read instead — which is how `responsive.test.ts` found the move.
 *
 * `--others --exclude-standard` adds the untracked files .gitignore does not
 * exclude; the existence filter drops the deleted ones. Paths come back
 * repo-relative, resolved against the working directory like every guard's ROOT.
 */
export function sourceFiles(...roots: string[]): string[] {
  return sourceFilesIn(process.cwd(), roots);
}

/** `sourceFiles` against any checkout — split out so the test can pin both
 *  halves in a scratch repo instead of depending on what is staged here. */
export function sourceFilesIn(cwd: string, roots: string[]): string[] {
  const out = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...roots],
    { cwd, encoding: "utf8" },
  );
  return [...new Set(out.split("\n").filter(Boolean))].filter((f) => existsSync(join(cwd, f)));
}
