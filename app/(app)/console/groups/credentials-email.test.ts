/**
 * SIGN-IN DETAILS REACH A STUDENT WHO GAVE AN ADDRESS — without ever putting
 * the credentials sheet at risk.
 *
 * The bulk import used to send nothing, on purpose: thirty SMTP round trips in
 * the request could time out after the accounts existed and before the
 * passwords were shown. The emails now go out in `after()`, once the sheet is
 * on screen. A reset used to reach only Telegram. Source-read, like the other
 * action tests here: jsdom cannot run a server action.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/* Every server module of this route — the actions AND the `_lib/` helpers
   they call — listed from disk, not by name. ⚠️ These checks used to read
   `./actions.ts` alone; when the actions were split across files (2026-10-17)
   a function that moved would have been looked up where it no longer is. */
const here = dirname(fileURLToPath(import.meta.url));
const sources = ["", "_lib"].flatMap((sub) =>
  readdirSync(join(here, sub))
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) =>
      readFileSync(join(here, sub, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1"),
    ),
);

/** A function's body, cut at the next declaration IN ITS OWN FILE. */
function fn(name: string): string {
  for (const src of sources) {
    const start = src.search(new RegExp(`(export )?(async )?function ${name}\\b`));
    if (start < 0) continue;
    const rest = src.slice(start + 1);
    const next = rest.search(/\n(export |async function |function |type |interface |const )/);
    return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
  }
  return "";
}

describe("bulk-added students", () => {
  const bulk = fn("addStudentsBulk");

  it("are emailed only from inside after(), so the sheet is never waiting on SMTP", () => {
    const later = bulk.indexOf("after(async () => {");
    expect(later).toBeGreaterThan(-1);
    const sends = [...bulk.matchAll(/sendCredentials\(/g)].map((m) => m.index!);
    expect(sends.length).toBeGreaterThan(0);
    for (const at of sends) expect(at).toBeGreaterThan(later);
  });

  it("only those with an address that can receive mail", () => {
    expect(bulk).toMatch(/created\.filter\(\(c\) => realContactEmail\(c\.email\)\)/);
    expect(fn("realContactEmail")).toMatch(/students\.engprogress\.com/);
  });
});

describe("a password reset", () => {
  const reset = fn("resetStudentPassword");

  it("is emailed to a real contact address, as a reset rather than a new account", () => {
    expect(reset).toMatch(/realContactEmail\(student\.contact_email/);
    expect(reset).toMatch(/kind: "reset"/);
    expect(reset).toMatch(/emailNote,\s*\}/);
  });
});

describe("the credentials email", () => {
  it("links to the public site, never the server it happened to run on", () => {
    expect(fn("sendCredentials")).toMatch(/serverEnv\.outboundSiteUrl\}\/sign-in/);
    expect(fn("sendCredentials")).not.toMatch(/serverEnv\.siteUrl/);
  });
});
