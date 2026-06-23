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
    name: "Trial",
    price: 0,
    currency: "usd",
    priceUzs: null,
    gradeLimit: 20,
    generateLimit: 30,
    seatLimit: 10,
    features: ["Calibrated AI grading", "Reading + Writing practice", "Up to 10 students"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    // Usage limits are placeholders — the real quotas land in a later billing pass.
    price: 4.99,
    currency: "usd",
    priceUzs: 60_000,
    gradeLimit: 200,
    generateLimit: 300,
    seatLimit: 50,
    features: ["Everything in Trial", "Up to 50 students", "Cohort analytics", "Teacher overrides"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 14.99,
    currency: "usd",
    priceUzs: 185_000,
    gradeLimit: 2000,
    generateLimit: 3000,
    seatLimit: 250,
    features: ["Everything in Starter", "Up to 250 students", "Priority grading queue", "Export & API"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 29.99,
    currency: "usd",
    priceUzs: 370_000,
    gradeLimit: null,
    generateLimit: null,
    seatLimit: null,
    features: ["Unlimited students", "Unlimited grading", "White-label", "SSO & SLA"],
  },
};

export function planTier(plan: OrgPlan): PlanTier {
  return PLAN_TIERS[plan] ?? PLAN_TIERS.trial;
}

export function isValidPlan(value: string): value is OrgPlan {
  return value in PLAN_TIERS;
}
