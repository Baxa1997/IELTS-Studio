import Link from "next/link";
import { redirect } from "next/navigation";

import { PLAN_ORDER, PLAN_TIERS, planTier, type OrgPlan } from "@/lib/billing/plans";
import { getSubscription } from "@/lib/billing/service";
import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { getGenerationQuota, getGradingQuota } from "@/lib/quota";
import { cn } from "@/lib/utils";

import { UpgradeButtons } from "./upgrade-buttons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Pending payment",
};

export default async function BillingPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "center_admin") redirect("/console");

  const [sub, grading, generation] = await Promise.all([
    getSubscription(profile.organization_id),
    getGradingQuota(profile.organization_id),
    getGenerationQuota(profile.organization_id),
  ]);
  const current = planTier(sub.plan);
  const providers = {
    stripe: serverEnv.stripe != null,
    payme: serverEnv.payme != null,
    click: serverEnv.click != null,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/console" className="text-muted-foreground hover:text-foreground text-sm">
          ← Console
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Billing &amp; plan</h1>
        <p className="text-muted-foreground">Your plan, usage, and upgrades.</p>
      </div>

      {/* Current plan + usage. */}
      <section className="rounded-lg border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Current plan</p>
            <p className="mt-1 text-xl font-semibold">{current.name}</p>
          </div>
          <div className="text-right text-sm">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                sub.status === "active" || sub.status === "trialing"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : sub.status === "incomplete"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "border-border text-muted-foreground",
              )}
            >
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
            {sub.currentPeriodEnd ? (
              <p className="text-muted-foreground mt-1 text-xs">
                renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Meter label="AI gradings this month" used={grading.used} limit={grading.limit} />
          <Meter label="AI generations this month" used={generation.used} limit={generation.limit} />
        </div>
      </section>

      {/* Plan tiers. */}
      <section className="grid gap-3 lg:grid-cols-4 sm:grid-cols-2">
        {PLAN_ORDER.map((id) => (
          <PlanCard key={id} plan={id} currentPlan={sub.plan} providers={providers} />
        ))}
      </section>

      <p className="text-muted-foreground text-xs">
        Card payments via Stripe; Payme and Click for Uzbekistan. Plan changes take effect once payment
        is confirmed.
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  providers,
}: {
  plan: OrgPlan;
  currentPlan: OrgPlan;
  providers: Record<"stripe" | "payme" | "click", boolean>;
}) {
  const tier = PLAN_TIERS[plan];
  const isCurrent = plan === currentPlan;
  const purchasable = plan === "starter" || plan === "pro";

  return (
    <div className={cn("flex flex-col rounded-lg border p-4", isCurrent && "border-primary/40 bg-primary/5")}>
      <div className="flex items-center justify-between">
        <p className="font-medium">{tier.name}</p>
        {isCurrent ? <span className="text-primary text-xs font-medium">Current</span> : null}
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {tier.price == null ? "Custom" : `$${tier.price}`}
        {tier.price != null && tier.price > 0 ? (
          <span className="text-muted-foreground text-sm font-normal">/mo</span>
        ) : null}
      </p>
      {tier.priceUzs != null ? (
        <p className="text-muted-foreground text-xs">≈ {tier.priceUzs.toLocaleString()} UZS/mo</p>
      ) : null}

      <ul className="text-muted-foreground mt-3 flex-1 space-y-1 text-xs">
        {tier.features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <div className="mt-3">
        {isCurrent ? (
          <p className="text-muted-foreground text-xs">You&apos;re on this plan.</p>
        ) : purchasable ? (
          <UpgradeButtons plan={plan} providers={providers} />
        ) : plan === "enterprise" ? (
          <a
            href="mailto:sales@example.com"
            className="text-primary text-xs underline underline-offset-2 hover:no-underline"
          >
            Contact sales
          </a>
        ) : (
          <p className="text-muted-foreground text-xs">Default plan.</p>
        )}
      </div>
    </div>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null;
  const near = pct != null && pct >= 80;
  return (
    <div className="rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {used}
        <span className="text-muted-foreground text-sm font-normal"> / {limit == null ? "∞" : limit}</span>
      </p>
      {pct != null ? (
        <div className="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full", near ? "bg-amber-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
