import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { build, isFontFlake, MAX_ATTEMPTS } from "./build.mjs";

/** A fake `next build`: counts its runs in a file, prints `text`, and fails until run `passOn`. */
function fakeBuild(text: string, passOn: number) {
  const dir = mkdtempSync(join(tmpdir(), "build-test-"));
  const counter = join(dir, "runs");
  const script = join(dir, "fake.mjs");
  writeFileSync(counter, "0");
  writeFileSync(
    script,
    `import { readFileSync, writeFileSync } from "node:fs";
const n = Number(readFileSync(${JSON.stringify(counter)}, "utf8")) + 1;
writeFileSync(${JSON.stringify(counter)}, String(n));
console.error(${JSON.stringify(text)});
process.exit(n >= ${passOn} ? 0 : 1);`,
  );
  return { script, runs: () => Number(readFileSync(counter, "utf8")) };
}

const FLAKE =
  "Module not found: Can't resolve '@vercel/turbopack-next/internal/font/google/font?{%22url%22:%22https://fonts.gstatic.com/…'";

describe("the build's font retry", () => {
  it("knows the font flake from a real error", () => {
    expect(isFontFlake(FLAKE)).toBe(true);
    expect(isFontFlake("Type error: Property 'x' does not exist on type 'Y'.")).toBe(false);
  });

  it("retries a dropped font download until the build passes", async () => {
    const fake = fakeBuild(FLAKE, 2);
    expect(await build({ command: process.execPath, args: [fake.script], wait: 0 })).toBe(0);
    expect(fake.runs()).toBe(2);
  });

  it("gives up after the last attempt and reports the failure", async () => {
    const fake = fakeBuild(FLAKE, 99);
    expect(await build({ command: process.execPath, args: [fake.script], wait: 0 })).toBe(1);
    expect(fake.runs()).toBe(MAX_ATTEMPTS);
  });

  /** The guard: our own mistakes must fail once, at once. */
  it("never retries an error that is not the font flake", async () => {
    const fake = fakeBuild("Type error: something we wrote is wrong", 99);
    expect(await build({ command: process.execPath, args: [fake.script], wait: 0 })).toBe(1);
    expect(fake.runs()).toBe(1);
  });
});
