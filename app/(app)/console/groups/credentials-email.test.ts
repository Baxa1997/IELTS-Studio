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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const src = readFileSync(fileURLToPath(new URL("./actions.ts", import.meta.url)), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");

function fn(name: string): string {
  const start = src.search(new RegExp(`(export )?(async )?function ${name}\\b`));
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const next = rest.search(/\n(export |async function |function |type |interface |const )/);
  return next < 0 ? src.slice(start) : src.slice(start, start + 1 + next);
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
