/**
 * THE WIRING OF THE ALLOWANCE WARNINGS.
 *
 * The thresholds are executed in quota-levels.test.ts. What that cannot see is
 * whether the sweep reads the SAME numbers the learner sees, sends only what it
 * newly claimed, and actually runs — so those are asserted where they are written.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const sweep = read("./quota-warnings.ts");
const route = read("../../app/api/jobs/expire-subscriptions/route.ts");

describe("the allowance warnings", () => {
  it("run in the nightly billing job, after expiry", () => {
    const expire = route.indexOf("await expireLapsedSubscriptions()");
    const warn = route.indexOf("await sendQuotaWarnings()");
    expect(expire).toBeGreaterThan(-1);
    expect(warn).toBeGreaterThan(expire);
  });

  it("read the learner's own numbers rather than counting again", () => {
    expect(sweep).toMatch(/await getUsageSummary\(organizationId\)/);
    expect(sweep).toMatch(/quotaLevel\(usage\[m\.key\]\)/);
    expect(sweep).not.toMatch(/count: "exact"/);
  });

  it("write to the plan's owner, through the shared answer", () => {
    expect(sweep).toMatch(/await planOwners\(organizationId\)/);
  });

  it("email only what this run newly claimed, keyed to the month it describes", () => {
    expect(sweep).toMatch(/if \(inserted\) fresh\.push\(hit\)/);
    expect(sweep).toMatch(/if \(fresh\.length === 0 \|\| !person\.email\) continue;/);
    expect(sweep).toMatch(/dedupeKey: `quota:\$\{hit\.key\}:\$\{hit\.level\}:\$\{hit\.quota\.resetAt\.slice\(0, 10\)\}`/);
  });
});
