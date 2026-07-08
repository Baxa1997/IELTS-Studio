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
  /** Monthly price in major USD units (Stripe). null = custom. */
  price: number | null;
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
  // Prices repriced 2026-07-08: Standard $5.99, Pro $12.99, Enterprise $24.99.
  // stripePriceId is null until the user creates matching dashboard Prices —
  // checkout then falls back to inline price_data, which charges exactly the
  // `price` below in BOTH test and live mode, so the new amounts are already
  // correct. When the dashboard Price IDs arrive, paste them here (or set
  // STRIPE_PRICE_<PLAN> per environment).
  starter: {
    id: "starter",
    name: "Standard",
    price: 5.99,
    currency: "usd",
    priceUzs: 75_000,
    stripePriceId: null, // pending new dashboard Price for $5.99
    gradeLimit: 200,
    generateLimit: 300,
    seatLimit: 50,
    features: ["Everything in Free", "200 gradings / month", "300 practice sets / month", "Full mock reading tests"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12.99,
    currency: "usd",
    priceUzs: 160_000,
    stripePriceId: null, // pending new dashboard Price for $12.99
    gradeLimit: 2000,
    generateLimit: 3000,
    seatLimit: 250,
    features: ["Everything in Standard", "2,000 gradings / month", "3,000 practice sets / month", "Priority grading queue"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 24.99,
    currency: "usd",
    priceUzs: 310_000,
    stripePriceId: null, // pending new dashboard Price for $24.99
    gradeLimit: null,
    generateLimit: null,
    seatLimit: null,
    features: ["Unlimited grading & practice", "Priority support", "White-label", "SSO & SLA"],
  },
};

export function planTier(plan: OrgPlan): PlanTier {
  return PLAN_TIERS[plan] ?? PLAN_TIERS.trial;
}

export function isValidPlan(value: string): value is OrgPlan {
  return value in PLAN_TIERS;
}
