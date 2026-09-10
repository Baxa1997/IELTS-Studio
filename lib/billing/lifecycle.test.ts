/**
 * THE BILLING LIFECYCLE RULES, EXECUTED — not read as source text.
 *
 * These are the rules four callers share: the Stripe webhook, the nightly job,
 * the quota reader and the admin console. They decide who keeps a paid plan, so
 * the cases that matter most are the ones where the right answer is NO:
 *
 * - a comped account with no subscription row must never lapse;
 * - a Stripe customer whose renewal webhook is a few hours late must not be
 *   throttled the moment their period rolls over;
 * - an abandoned second checkout must not end the subscription still being paid;
 * - an event that omits the customer id must not erase the one stored.
 */

import { describe, expect, it } from "vitest";

import {
  STRIPE_RENEWAL_GRACE_MS,
  hasLapsed,
  isAboutAnotherSubscription,
  isLiveSubscription,
  orgEffect,
  shouldMarkPending,
  subscriptionUpsert,
} from "./lifecycle";
import type { PlanChange } from "./types";

const NOW = Date.parse("2026-09-10T12:00:00Z");
const DAY = 864e5;
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

describe("hasLapsed — who has run out", () => {
  it("never lapses an org with no subscription row", () => {
    // The owner's own org is exactly this: plan `pro`, no row.
    expect(hasLapsed(null, NOW)).toBe(false);
    expect(hasLapsed(undefined, NOW)).toBe(false);
  });

  it("never lapses a row with no end date", () => {
    expect(hasLapsed({ status: "active", current_period_end: null, provider: "payme" }, NOW)).toBe(false);
  });

  it("never lapses a closed row", () => {
    // Whatever plan the org holds after that was put there on purpose.
    expect(hasLapsed({ status: "canceled", current_period_end: at(-40 * DAY), provider: "click" }, NOW)).toBe(false);
  });

  it("refuses to guess on a date it cannot read", () => {
    expect(hasLapsed({ status: "active", current_period_end: "soon", provider: "payme" }, NOW)).toBe(false);
  });

  it("ends a Payme or Click period at the date itself", () => {
    expect(hasLapsed({ status: "active", current_period_end: at(1), provider: "payme" }, NOW)).toBe(false);
    expect(hasLapsed({ status: "active", current_period_end: at(0), provider: "payme" }, NOW)).toBe(true);
    expect(hasLapsed({ status: "active", current_period_end: at(-1), provider: "click" }, NOW)).toBe(true);
  });

  it("gives Stripe a renewal window before calling it lapsed", () => {
    // Stripe renews by itself. A webhook that lands hours late must not
    // throttle somebody who has just been charged.
    const justRolledOver = { status: "active", current_period_end: at(-2 * 60 * 60 * 1000), provider: "stripe" };
    expect(hasLapsed(justRolledOver, NOW)).toBe(false);
    const insideGrace = { status: "active", current_period_end: at(-STRIPE_RENEWAL_GRACE_MS + DAY), provider: "stripe" };
    expect(hasLapsed(insideGrace, NOW)).toBe(false);
    const pastGrace = { status: "active", current_period_end: at(-STRIPE_RENEWAL_GRACE_MS - 1), provider: "stripe" };
    expect(hasLapsed(pastGrace, NOW)).toBe(true);
  });
});

describe("isLiveSubscription — is somebody paying for this", () => {
  it("counts an active Stripe row with no stored date as live", () => {
    // ziyod's row today: active, paying, NULL date. Treating that as unpaid is
    // the exact harm this rewrite exists to prevent.
    expect(isLiveSubscription({ status: "active", current_period_end: null, provider: "stripe" }, NOW)).toBe(true);
  });

  it("does not count a failing, pending or closed row", () => {
    for (const status of ["past_due", "incomplete", "canceled"]) {
      expect(isLiveSubscription({ status, current_period_end: at(10 * DAY), provider: "stripe" }, NOW)).toBe(false);
    }
  });

  it("does not count an active Payme row whose month is over", () => {
    expect(isLiveSubscription({ status: "active", current_period_end: at(-DAY), provider: "payme" }, NOW)).toBe(false);
  });
});

describe("orgEffect — what a status does to the plan", () => {
  it("grants on paying states", () => {
    expect(orgEffect("active")).toBe("grant");
    expect(orgEffect("trialing")).toBe("grant");
  });

  it("says a failing renewal honestly, not as an ending", () => {
    // A retry tomorrow brings the plan back, so "your plan has ended" is untrue.
    expect(orgEffect("past_due")).toBe("payment_failed");
  });

  it("ends on canceled", () => {
    expect(orgEffect("canceled")).toBe("ended");
  });

  it("does nothing on incomplete, because nothing was paid", () => {
    // If the org holds a paid plan it came from a comp or another subscription,
    // and downgrading here removed those.
    expect(orgEffect("incomplete")).toBe("none");
  });
});

describe("subscriptionUpsert — an event can add facts, never erase them", () => {
  const base: PlanChange = { organizationId: "org-1", plan: "pro", status: "canceled", provider: "stripe" };

  it("leaves out the customer, subscription and date when the event has none", () => {
    // `customer.subscription.deleted` carries no customer. Writing null here
    // erased the one link a later refund uses to find the org.
    const row = subscriptionUpsert({ ...base, externalCustomerId: null, currentPeriodEnd: null }, "t");
    expect(row).not.toHaveProperty("external_customer_id");
    expect(row).not.toHaveProperty("external_subscription_id");
    expect(row).not.toHaveProperty("current_period_end");
  });

  it("writes them when the event carries them", () => {
    const row = subscriptionUpsert(
      { ...base, externalCustomerId: "cus_1", externalSubscriptionId: "sub_1", currentPeriodEnd: "2026-10-11T00:00:00.000Z" },
      "t",
    );
    expect(row).toMatchObject({
      external_customer_id: "cus_1",
      external_subscription_id: "sub_1",
      current_period_end: "2026-10-11T00:00:00.000Z",
    });
  });

  it("always writes the facts every event has", () => {
    expect(subscriptionUpsert(base, "2026-09-10")).toEqual({
      organization_id: "org-1",
      provider: "stripe",
      plan: "pro",
      status: "canceled",
      updated_at: "2026-09-10",
    });
  });
});

describe("shouldMarkPending — clicking Upgrade must not unpay anybody", () => {
  it("does not overwrite a subscription being paid for", () => {
    expect(shouldMarkPending({ status: "active", current_period_end: at(20 * DAY), provider: "stripe" }, NOW)).toBe(false);
  });

  it("marks everything else pending", () => {
    expect(shouldMarkPending(null, NOW)).toBe(true);
    expect(shouldMarkPending({ status: "incomplete", current_period_end: null, provider: "stripe" }, NOW)).toBe(true);
    expect(shouldMarkPending({ status: "active", current_period_end: at(-DAY), provider: "payme" }, NOW)).toBe(true);
  });
});

describe("isAboutAnotherSubscription — a dead second checkout", () => {
  const live = { status: "active", current_period_end: at(20 * DAY), provider: "stripe", external_subscription_id: "sub_live" };

  it("ignores a failing event for a different subscription while one is live", () => {
    expect(
      isAboutAnotherSubscription(live, { provider: "stripe", status: "past_due", externalSubscriptionId: "sub_new" }, NOW),
    ).toBe(true);
    expect(
      isAboutAnotherSubscription(live, { provider: "stripe", status: "canceled", externalSubscriptionId: "sub_new" }, NOW),
    ).toBe(true);
  });

  it("still applies events about the live subscription itself", () => {
    expect(
      isAboutAnotherSubscription(live, { provider: "stripe", status: "canceled", externalSubscriptionId: "sub_live" }, NOW),
    ).toBe(false);
  });

  it("still applies a PAYING event for a new subscription — that is an upgrade", () => {
    expect(
      isAboutAnotherSubscription(live, { provider: "stripe", status: "active", externalSubscriptionId: "sub_new" }, NOW),
    ).toBe(false);
  });

  it("only ever applies to Stripe, and only over a live row with real ids", () => {
    expect(isAboutAnotherSubscription(live, { provider: "payme", status: "canceled", externalSubscriptionId: "x" }, NOW)).toBe(false);
    const dead = { ...live, status: "past_due" };
    expect(isAboutAnotherSubscription(dead, { provider: "stripe", status: "canceled", externalSubscriptionId: "sub_new" }, NOW)).toBe(false);
    const sessionId = { ...live, external_subscription_id: "cs_live_abc" };
    expect(isAboutAnotherSubscription(sessionId, { provider: "stripe", status: "canceled", externalSubscriptionId: "sub_new" }, NOW)).toBe(false);
  });
});
