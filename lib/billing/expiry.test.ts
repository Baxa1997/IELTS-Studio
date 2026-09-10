/**
 * PAID PLANS ENDING WHEN THEY ARE SUPPOSED TO.
 *
 * Nothing ever expired. `current_period_end` was written and never read, so an
 * org that paid once kept its plan permanently — one $14.99 bought unlimited
 * grading for good — and the learner was never told either way.
 *
 * `hasLapsed` is the predicate that decides who keeps a paid plan, so it is
 * pure and unit-testable rather than buried in a query. The case that matters
 * most is the one it must say NO to: production has several paid orgs with no
 * subscription row at all — comped accounts, the shared library orgs, and plans
 * granted by hand from the admin console, the owner's own among them. A rule
 * that read "no end date" as "ended" would have downgraded every one of them on
 * its first run, silently and all at once.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { hasLapsed } from "./expiry";

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const NOW = Date.parse("2026-09-10T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * 864e5).toISOString();
const ahead = (days: number) => new Date(NOW + days * 864e5).toISOString();

describe("what has NOT lapsed", () => {
  it("says no when there is no subscription at all", () => {
    // The owner's own org is exactly this: plan `pro`, no subscription row.
    expect(hasLapsed(null, NOW)).toBe(false);
    expect(hasLapsed(undefined, NOW)).toBe(false);
  });

  it("says no when there is no end date", () => {
    // Every Stripe row in production was in this state before the checkout fix.
    // Reading it as "ended" would have downgraded all of them.
    expect(hasLapsed({ status: "active", current_period_end: null }, NOW)).toBe(false);
  });

  it("says no while the period is still running", () => {
    expect(hasLapsed({ status: "active", current_period_end: ahead(3) }, NOW)).toBe(false);
  });

  it("says no for one already closed", () => {
    // Otherwise the nightly pass re-expires it and re-sends the email forever.
    expect(hasLapsed({ status: "canceled", current_period_end: ago(40) }, NOW)).toBe(false);
  });

  it("says no on an unparseable date rather than guessing", () => {
    expect(hasLapsed({ status: "active", current_period_end: "not a date" }, NOW)).toBe(false);
  });
});

describe("what HAS lapsed", () => {
  it("says yes for an active plan whose period has passed", () => {
    expect(hasLapsed({ status: "active", current_period_end: ago(1) }, NOW)).toBe(true);
  });

  it("catches past_due and incomplete too", () => {
    // Only `canceled` is terminal. A payment that never completed should not
    // keep granting a paid tier once its window has gone.
    expect(hasLapsed({ status: "past_due", current_period_end: ago(5) }, NOW)).toBe(true);
    expect(hasLapsed({ status: "incomplete", current_period_end: ago(5) }, NOW)).toBe(true);
  });

  it("treats the exact boundary as ended", () => {
    expect(hasLapsed({ status: "active", current_period_end: new Date(NOW).toISOString() }, NOW)).toBe(true);
  });
});

describe("the two halves cannot disagree", () => {
  const quota = read("../quota.ts");
  const expiry = read("./expiry.ts");

  it("has the read path consult the same predicate as the cron", () => {
    // A daily job is up to a day late, and quota is read hundreds of times a
    // day. Without this, every expiry handed out a free day of Pro.
    expect(quota).toMatch(/import \{ hasLapsed \} from "@\/lib\/billing\/expiry"/);
    expect(quota).toMatch(/if \(hasLapsed\(sub\)\)/);
  });

  it("derives on the read path instead of writing", () => {
    // loadOrg is a hot path; a write there would turn every quota check into a
    // transaction. The cron is what makes the downgrade durable.
    const fn = quota.slice(quota.indexOf("async function loadOrg"), quota.indexOf("type LoadedOrg"));
    expect(fn).not.toMatch(/\.update\(/);
    expect(fn).toMatch(/plan: "trial"/);
  });

  it("drops the per-org limit overrides with the plan", () => {
    // Those overrides are what an admin granted alongside a paid tier. Leaving
    // them would keep the allowance the payment bought after it stopped.
    const fn = quota.slice(quota.indexOf("async function loadOrg"), quota.indexOf("type LoadedOrg"));
    expect(fn).toMatch(/grading_monthly_limit: null/);
    expect(fn).toMatch(/generation_monthly_limit: null/);
  });

  it("closes the subscription before downgrading the org", () => {
    // A closed subscription beside a still-Pro org is visible and fixable next
    // run. The reverse re-downgrades and re-mails every single night.
    const close = expiry.indexOf('status: "canceled", updated_at');
    const downgrade = expiry.indexOf('.update({ plan: "trial" })');
    expect(close).toBeGreaterThan(-1);
    expect(close).toBeLessThan(downgrade);
  });

  it("re-checks status at write time so overlapping runs cannot both claim it", () => {
    expect(expiry).toMatch(/\.neq\("status", "canceled"\)/);
  });

  it("emails only after the downgrade has landed", () => {
    const downgrade = expiry.indexOf('.update({ plan: "trial" })');
    const email = expiry.indexOf("notifyPlanExpired(");
    expect(email).toBeGreaterThan(downgrade);
  });
});

describe("the root cause: a plan with no end date never ends", () => {
  const stripe = read("./stripe.ts");

  it("records a period end at checkout", () => {
    // A checkout session carries no `current_period_end` — only the
    // subscription object does, and those events bail when their metadata has
    // no plan, which is the ordinary case for a checkout-created subscription.
    // So every Stripe row in production had NULL, and NULL never expires.
    const branch = stripe.slice(stripe.indexOf('case "checkout.session.completed"'), stripe.indexOf('case "customer.subscription.updated"'));
    expect(branch).toMatch(/currentPeriodEnd: periodEndFor\(plan\)/);
  });

  it("takes the length from the tier, not a hardcoded month", () => {
    // Enterprise is one payment for three months. A flat +1 month would expire
    // it twice too early and mail the learner about it.
    const fn = stripe.slice(stripe.indexOf("function periodEndFor"));
    expect(fn.slice(0, fn.indexOf("\n}"))).toMatch(/planTier\(plan\)\?\.months/);
  });
});

describe("what the learner is told", () => {
  const notify = read("./notify-expiry.ts");

  it("says their work is untouched, because that is the actual fear", () => {
    expect(notify).toMatch(/still there/);
  });

  it("falls back to the auth address when the profile has none", () => {
    // Same two-places problem as the referral emails: a self-signup's address
    // lives on `auth.users` and the profile column is NULL.
    expect(notify).toMatch(/auth\.admin\.getUserById/);
  });

  it("never writes to the synthetic student address", () => {
    expect(notify).toMatch(/students\.engprogress\.com/);
  });

  it("cannot fail the downgrade it is announcing", () => {
    expect(notify).toMatch(/catch \(err\)/);
  });
});
