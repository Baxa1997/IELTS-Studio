import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { sourceFiles, sourceFilesIn } from "./source-files";

/**
 * The guards that scan the source tree are only as good as the list they walk.
 * These pin the two ways `git ls-files` alone got that list wrong — see the
 * note on `sourceFiles`.
 *
 * In a scratch repo, not this one: whether this checkout happens to have
 * unstaged moves in it is an accident of the day, and a pin that only bites on
 * the right day is not a pin.
 */
describe("sourceFilesIn", () => {
  let repo = "";
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  function scratch(): string {
    repo = mkdtempSync(join(tmpdir(), "source-files-"));
    execFileSync("git", ["init", "-q"], { cwd: repo });
    mkdirSync(join(repo, "src"));
    return repo;
  }

  it("lists a file that exists but has never been staged", () => {
    const dir = scratch();
    writeFileSync(join(dir, "src/moved.ts"), "export {};\n");
    expect(sourceFilesIn(dir, ["src"])).toEqual(["src/moved.ts"]);
  });

  it("drops a file that is still staged but no longer on disk", () => {
    const dir = scratch();
    writeFileSync(join(dir, "src/gone.ts"), "export {};\n");
    execFileSync("git", ["add", "src/gone.ts"], { cwd: dir });
    rmSync(join(dir, "src/gone.ts"));
    expect(sourceFilesIn(dir, ["src"])).toEqual([]);
  });

  it("still honours .gitignore", () => {
    const dir = scratch();
    writeFileSync(join(dir, ".gitignore"), "src/built.ts\n");
    writeFileSync(join(dir, "src/built.ts"), "export {};\n");
    expect(sourceFilesIn(dir, ["src"])).toEqual([]);
  });
});

describe("sourceFiles, on this repo", () => {
  it("reaches the shared kit", () => {
    const files = sourceFiles("app", "shared", "lib");
    expect(files.length).toBeGreaterThan(200);
    expect(files).toContain("shared/components/practice/card.tsx");
  });
});
