/**
 * THE STRIPE WEBHOOK, DRIVEN WITH REAL SIGNED EVENTS.
 *
 * Every Stripe subscription row in production had `current_period_end = NULL`.
 * The cause was not missing metadata (an earlier note claimed that, wrongly):
 * this account and its webhook endpoint run API 2026-01-28.clover, which moved
 * the period off the subscription and onto its items. The mapper read a field
 * that no longer exists, got undefined, and the upsert wrote null.
 *
 * The item timestamps below are the real ones from the live subscription that
 * exposed it (sub_1U3EZ9…: period 2026-08-11 → 2026-09-11 12:13:28 UTC), so the
 * test pins the shape Stripe actually sends rather than the shape the docs of an
 * older version describe.
 *
 * Goes through `stripeVerifyAndParse` with a properly signed body, so the path
 * under test is the one the route calls.
 */

import { createHmac } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { periodEndOf, stripeVerifyAndParse } from "./stripe";

const SECRET = "whsec_test_period";

beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_period";
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
});

function signed(event: unknown) {
  const body = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", SECRET).update(`${t}.${body}`).digest("hex");
  return stripeVerifyAndParse(body, `t=${t},v1=${v1}`);
}

const CLOVER_SUBSCRIPTION = {
  id: "sub_1U3EZ9AbAzJriIHUhGlHGiCs",
  object: "subscription",
  status: "active",
  customer: "cus_V3LCsa1139J1lD",
  metadata: { organizationId: "de4dc18d-a441-4d87-a8c1-274673558336", plan: "pro" },
  // No top-level current_period_end — exactly as Stripe returned it.
  items: { data: [{ current_period_start: 1786450408, current_period_end: 1789128808 }] },
};

describe("the period is read from where this API version keeps it", () => {
  it("reads current_period_end off the subscription items", () => {
    const { change } = signed({
      id: "evt_1",
      type: "customer.subscription.updated",
      data: { object: CLOVER_SUBSCRIPTION },
    });
    expect(change?.currentPeriodEnd).toBe("2026-09-11T12:13:28.000Z");
    expect(change?.status).toBe("active");
    expect(change?.externalSubscriptionId).toBe("sub_1U3EZ9AbAzJriIHUhGlHGiCs");
    expect(change?.externalCustomerId).toBe("cus_V3LCsa1139J1lD");
  });

  it("still reads the old top-level field for an event rendered by an older version", () => {
    expect(periodEndOf({ current_period_end: 1789128808 })).toBe("2026-09-11T12:13:28.000Z");
  });

  it("takes the latest end when there are several items", () => {
    expect(
      periodEndOf({ items: { data: [{ current_period_end: 1789128808 }, { current_period_end: 1789128900 }] } }),
    ).toBe(new Date(1789128900 * 1000).toISOString());
  });

  it("returns null rather than inventing a date when there is none", () => {
    expect(periodEndOf({ items: { data: [] } })).toBeNull();
    expect(periodEndOf({})).toBeNull();
  });
});

describe("what each event becomes", () => {
  it("carries a failed renewal through as past_due, with its date", () => {
    const { change } = signed({
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: { ...CLOVER_SUBSCRIPTION, status: "past_due" } },
    });
    expect(change?.status).toBe("past_due");
    expect(change?.currentPeriodEnd).toBe("2026-09-11T12:13:28.000Z");
  });

  it("maps unpaid to canceled", () => {
    const { change } = signed({
      id: "evt_3",
      type: "customer.subscription.updated",
      data: { object: { ...CLOVER_SUBSCRIPTION, status: "unpaid" } },
    });
    expect(change?.status).toBe("canceled");
  });

  it("gives a completed checkout an end date from the tier", () => {
    const before = Date.now();
    const { change } = signed({
      id: "evt_4",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_live_x",
          client_reference_id: "org-9",
          metadata: { organizationId: "org-9", plan: "enterprise" },
          customer: "cus_9",
          subscription: "sub_9",
          amount_total: 2999,
          currency: "usd",
        },
      },
    });
    expect(change?.amountMinor).toBe(2999);
    // Enterprise is one payment for three months, not one.
    const end = Date.parse(String(change?.currentPeriodEnd));
    expect(end - before).toBeGreaterThan(85 * 864e5);
    expect(end - before).toBeLessThan(95 * 864e5);
  });

  it("ignores a subscription event with no plan rather than guessing one", () => {
    const { change } = signed({
      id: "evt_5",
      type: "customer.subscription.updated",
      data: { object: { ...CLOVER_SUBSCRIPTION, metadata: { organizationId: "org-1" } } },
    });
    expect(change).toBeNull();
  });

  it("maps a deletion to canceled WITHOUT a customer — so the upsert must not erase it", () => {
    // The pairing that mattered: this event has no customer, and the old
    // upsert wrote `external_customer_id: null` from it.
    const { change } = signed({
      id: "evt_6",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", metadata: { organizationId: "org-1", plan: "pro" } } },
    });
    expect(change?.status).toBe("canceled");
    expect(change?.externalCustomerId ?? null).toBeNull();
  });

  it("rejects an unsigned body outright", () => {
    expect(() => stripeVerifyAndParse(JSON.stringify({ id: "x", type: "y", data: { object: {} } }), null)).toThrow();
  });
});
