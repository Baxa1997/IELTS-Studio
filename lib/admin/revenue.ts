import "server-only";

import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What the platform actually earns.
 *
 * THE ONE THING THIS FILE IS CAREFUL ABOUT. Two tables disagree about who is
 * paying, and the disagreement is real rather than a bug to paper over:
 *
 *   `organizations.plan`   — what an account is ALLOWED to do. Set by a webhook,
 *                            and also by hand when the owner comps someone.
 *   `subscriptions.status` — whether money is actually arriving.
 *
 * Today six organizations carry a paid plan and exactly one subscription is
 * `active`; the rest are `incomplete` — checkouts that were started and
 * abandoned. Reporting the six as revenue would overstate income by 6x, and
 * reporting only the one would hide that five accounts are running on paid
 * limits for free. So both are returned, separately named, and the gap between
 * them is the interesting number rather than an embarrassment to hide.
 *
 * Service-role throughout: a super admin has no org, so RLS returns nothing.
 * Guarded by `requireSuperAdmin` at the page.
 */

const DAY = 24 * 60 * 60 * 1000;

/** A plan's price normalised to ONE month. Enterprise bills a quarter up front,
 *  so charging it at face value would triple that customer in the MRR line. */
export function monthlyPrice(plan: OrgPlan): number {
  const tier = PLAN_TIERS[plan];
  const price = tier?.price ?? 0;
  if (!price || price <= 0) return 0;
  return price / Math.max(1, tier.months);
}

export interface PlanLine {
  plan: OrgPlan;
  name: string;
  /** Organizations GRANTED this plan, whether or not they pay. */
  granted: number;
  /** Of those, how many have an active subscription behind them. */
  paying: number;
  /** Monthly recurring from the paying ones only. */
  mrr: number;
  price: number;
  color: string;
}

export interface RevenueSnapshot {
  /** Real monthly recurring: active subscriptions only. */
  mrr: number;
  /** What MRR would be if every granted paid plan were actually paying. */
  grantedMrr: number;
  activeSubscriptions: number;
  /** Checkouts started and never finished. */
  incompleteSubscriptions: number;
  /** Orgs on a paid plan with no active subscription — comped, or a lapsed payment. */
  unpaidPaidPlans: number;
  totalAccounts: number;
  payingAccounts: number;
  lines: PlanLine[];
  /** Month by month, from when each active subscription started. */
  history: { month: string; label: string; mrr: number }[];
  /** Every account, by the plan it is granted. */
  funnel: { stage: string; n: number; share: number }[];
}

const PLAN_COLOR: Record<OrgPlan, string> = {
  trial: "#C9C7E4",
  starter: "#E5A85C",
  pro: "#7FD8A8",
  enterprise: "#7C79DB",
};

export async function loadRevenue(): Promise<RevenueSnapshot> {
  const admin = createAdminClient();

  const [orgsRes, subsRes] = await Promise.all([
    admin.from("organizations").select("id, plan, kind, status, billing_enforced"),
    admin.from("subscriptions").select("organization_id, plan, status, created_at, current_period_end"),
  ]);

  const orgs = (orgsRes.data ?? []) as {
    id: string;
    plan: OrgPlan;
    kind: string;
    status: string;
    billing_enforced: boolean;
  }[];
  const subs = (subsRes.data ?? []) as {
    organization_id: string;
    plan: OrgPlan;
    status: string;
    created_at: string;
  }[];

  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
  // "trialing" is a live Stripe subscription that has not billed yet, so it
  // counts as a customer but contributes nothing this month.
  const billing = subs.filter((s) => s.status === "active");
  const payingOrgIds = new Set(billing.map((s) => s.organization_id));

  const lines: PlanLine[] = PLAN_ORDER.map((plan) => {
    const granted = orgs.filter((o) => o.plan === plan);
    const paying = granted.filter((o) => payingOrgIds.has(o.id));
    return {
      plan,
      name: PLAN_TIERS[plan].name,
      granted: granted.length,
      paying: paying.length,
      mrr: paying.length * monthlyPrice(plan),
      price: PLAN_TIERS[plan].price ?? 0,
      color: PLAN_COLOR[plan],
    };
  });

  const paidPlans = orgs.filter((o) => o.plan !== "trial");

  // MRR by month, reconstructed from when each still-active subscription began.
  // Honest but limited, and the limit is worth naming: a subscription that ran
  // for three months and then cancelled leaves no row, so past months read a
  // little low. Fixing that properly needs the invoice history off Stripe.
  const months: { month: string; label: string; mrr: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const mrr = billing
      .filter((s) => new Date(s.created_at) < end)
      .reduce((sum, s) => sum + monthlyPrice(s.plan), 0);
    months.push({
      month: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      mrr: Math.round(mrr * 100) / 100,
    });
  }

  const total = orgs.length;
  const everStarted = new Set(subs.map((s) => s.organization_id)).size;
  const funnel = [
    { stage: "Signed up", n: total, share: 1 },
    { stage: "Started a checkout", n: everStarted, share: total ? everStarted / total : 0 },
    { stage: "On a paid plan", n: paidPlans.length, share: total ? paidPlans.length / total : 0 },
    { stage: "Actually paying", n: payingOrgIds.size, share: total ? payingOrgIds.size / total : 0 },
  ];

  return {
    mrr: Math.round(billing.reduce((s, x) => s + monthlyPrice(x.plan), 0) * 100) / 100,
    grantedMrr:
      Math.round(paidPlans.reduce((s, o) => s + monthlyPrice(o.plan), 0) * 100) / 100,
    activeSubscriptions: activeSubs.length,
    incompleteSubscriptions: subs.filter((s) => s.status === "incomplete").length,
    unpaidPaidPlans: paidPlans.filter((o) => !payingOrgIds.has(o.id)).length,
    totalAccounts: total,
    payingAccounts: payingOrgIds.size,
    lines,
    history: months,
    funnel,
  };
}

/** Sign-ups in the last 30 days that have never paid — the top of the funnel. */
export async function loadRecentFreeSignups(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("organizations")
    .select("id", { count: "exact", head: true })
    .eq("plan", "trial")
    .gte("created_at", new Date(Date.now() - 30 * DAY).toISOString());
  return count ?? 0;
}
