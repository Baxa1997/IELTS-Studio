/**
 * Plan tiers — the single source of truth for what each plan costs and allows.
 * Pure (no I/O, no `server-only`) so the quota layer, billing providers and a
 * pricing UI all share one definition. `null` limit = unlimited; `null` price =
 * custom (sales-led). Prices are monthly, in the plan's currency.
 */

export type OrgPlan = "trial" | "starter" | "pro" | "enterprise";

export interface PlanTier {
  id: OrgPlan;
  name: string;
  /** Price in major USD units (Stripe) per billing period. null = custom. */
  price: number | null;
  /** Billing period length in months (1 = monthly; enterprise is a 3-month pass). */
  months: number;
  currency: "usd";
  /** Monthly price in UZS (Payme/Click settle in UZS; tiyin = priceUzs × 100).
   *  null = not sold via the UZ gateways (trial/enterprise). */
  priceUzs: number | null;
  /** LIVE-mode Stripe Price for this tier (the dashboard products). When set,
   *  checkout charges THIS price and `price` above is display-only — keep them
   *  matching. Overridable per-env via STRIPE_PRICE_<PLAN> (e.g. test mode). */
  stripePriceId: string | null;
  /** Monthly AI gradings. null = unlimited. */
  gradeLimit: number | null;
  /** Monthly AI generations (prompts + reading sets). null = unlimited. */
  generateLimit: number | null;
  /** Student seats. null = unlimited. */
  seatLimit: number | null;
  features: string[];
}

export const PLAN_ORDER: OrgPlan[] = ["trial", "starter", "pro", "enterprise"];

export const PLAN_TIERS: Record<OrgPlan, PlanTier> = {
  trial: {
    id: "trial",
    name: "Free",
    price: 0,
    months: 1,
    currency: "usd",
    priceUzs: null,
    // 5 free gradings + 5 free generations, then upgrade. generateLimit MUST stay
    // in sync with the engine's PLAN_GENERATE_LIMITS (ielts-ai-engine/quota.py) —
    // the engine enforces generation quota for the browser-direct endpoints.
    gradeLimit: 5,
    generateLimit: 5,
    seatLimit: 10,
    stripePriceId: null,
    // Feature copy is learner-facing (B2C — CLAUDE.md); seatLimit stays in the
    // schema for the dormant B2B path but is never sold as a feature.
    features: ["Calibrated, conservative AI grading", "IELTS + CEFR practice, generated fresh", "5 gradings · 5 practice sets / month"],
  },
  // Pricing strategy 2026-07-08 (user): Free 5/5 · Standard $5.99 25/25 ·
  // Pro $14.99 unlimited monthly · Enterprise $29.99 for THREE months
  // (unlimited, prepaid quarter). Live checkout charges the pinned dashboard
  // Prices below (user confirmed the dashboard shows these exact amounts and
  // the 3-month interval; the old 6.00/14.49/25.99 Prices are archived) —
  // FIRST LIVE CHECKOUT of each tier must confirm the displayed amount. A
  // "price is archived" checkout error means the wrong ID is pinned: set it
  // back to null and inline price_data takes over at exactly `price`.
  starter: {
    id: "starter",
    name: "Standard",
    price: 5.99,
    months: 1,
    currency: "usd",
    priceUzs: 75_000,
    stripePriceId: "price_1TodTCAbAzJriIHUxzsOKT52", // live "Ielts Standard" $5.99/mo
    gradeLimit: 25,
    generateLimit: 25,
    seatLimit: 50,
    features: ["Everything in Free", "25 gradings / month", "25 practice sets / month", "Full mock reading tests"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 14.99,
    months: 1,
    currency: "usd",
    priceUzs: 185_000,
    stripePriceId: "price_1TodTaAbAzJriIHUYFQOiHi0", // live "Ielts Pro" $14.99/mo
    gradeLimit: null,
    generateLimit: null,
    seatLimit: 250,
    features: ["Everything in Standard", "Unlimited gradings", "Unlimited practice sets", "Priority grading queue"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 29.99,
    months: 3, // one payment covers 3 months (≈ $10/month)
    currency: "usd",
    priceUzs: 375_000,
    stripePriceId: "price_1TodTzAbAzJriIHUmxtroK31", // live "Ielts Enterprice" $29.99 / 3 months
    gradeLimit: null,
    generateLimit: null,
    seatLimit: null,
    features: ["Everything in Pro, for 3 months", "One payment — $29.99 per quarter", "Best value: under $10 / month"],
  },
};

export function planTier(plan: OrgPlan): PlanTier {
  return PLAN_TIERS[plan] ?? PLAN_TIERS.trial;
}

export function isValidPlan(value: string): value is OrgPlan {
  return value in PLAN_TIERS;
}
