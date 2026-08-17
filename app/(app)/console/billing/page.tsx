import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  CardNote,
  FAINT,
  GREEN,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  PageHead,
  RAIL,
  SANS,
  SERIF,
  SOFT,
  Split,
  Stack,
  Tag,
  type Tone,
} from "@/components/console/crm-ui";
import { PLAN_ORDER, PLAN_TIERS, planTier, type OrgPlan } from "@/lib/billing/plans";
import { getSubscription } from "@/lib/billing/service";
import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { getGenerationQuota, getGradingQuota } from "@/lib/quota";

import { UpgradeButtons } from "./upgrade-buttons";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  trialing: { label: "Trial", tone: "indigo" },
  active: { label: "Active", tone: "green" },
  past_due: { label: "Past due", tone: "red" },
  canceled: { label: "Canceled", tone: "neutral" },
  incomplete: { label: "Pending payment", tone: "amber" },
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
  const status = STATUS[sub.status] ?? { label: sub.status, tone: "neutral" as Tone };
  const providers = {
    stripe: serverEnv.stripe != null,
    payme: serverEnv.payme != null,
    click: serverEnv.click != null,
  };
  // A center runs unmetered on purpose (organizations.billing_enforced = false),
  // so its quotas come back with no limit. Say so plainly rather than drawing a
  // bar against a ceiling that isn't being enforced.
  const unmetered = grading.limit == null && generation.limit == null;

  return (
    <div>
      <PageHead
        eyebrow="Admin"
        title="Billing & plan"
        subtitle="Your platform plan and what your center has used this month."
      />

      <KpiRow>
        <Kpi label="Plan" value={current.name} sub={status.label} />
        <Kpi
          label="Essays graded"
          value={grading.used}
          sub={grading.limit == null ? "no limit applied" : `of ${grading.limit} this month`}
        />
        <Kpi
          label="Practice generated"
          value={generation.used}
          sub={generation.limit == null ? "no limit applied" : `of ${generation.limit} this month`}
        />
        <Kpi
          label="Renews"
          value={
            sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          sub={sub.currentPeriodEnd ? "next billing date" : "no renewal scheduled"}
        />
      </KpiRow>

      <Stack>
        <Split ratio="1.3fr .7fr">
          {/* ── current plan, on the dark card the design uses for money ────── */}
          <Card tone="dark" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11.5,
                    letterSpacing: ".1em",
                    color: RAIL.light,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Current plan
                </div>
                <div
                  style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 700, margin: "6px 0 2px" }}
                >
                  {current.name}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: RAIL.light }}>
                  {status.label}
                  {sub.currentPeriodEnd
                    ? ` · renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: SANS, fontSize: 26, fontWeight: 600 }}>
                  {current.price == null ? "Custom" : `$${current.price}`}
                  {current.price != null && current.price > 0 ? (
                    <span style={{ fontSize: 14, color: RAIL.light }}>/mo</span>
                  ) : null}
                </div>
                {current.priceUzs != null ? (
                  <div style={{ fontFamily: SANS, fontSize: 12, color: RAIL.light }}>
                    ≈ {current.priceUzs.toLocaleString()} UZS
                  </div>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginTop: 22,
              }}
            >
              <Usage label="Essays graded" used={grading.used} limit={grading.limit} />
              <Usage label="Practice generated" used={generation.used} limit={generation.limit} />
            </div>

            {unmetered ? (
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: RAIL.light,
                  margin: "16px 0 0",
                  lineHeight: 1.5,
                }}
              >
                Your center runs unmetered while it&apos;s in early access — these are counts, not
                caps, and nothing is cut off when they rise.
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHead title="How you can pay" />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <Tag tone={providers.stripe ? "green" : "neutral"}>
                Card{providers.stripe ? "" : " (not set up)"}
              </Tag>
              <Tag tone={providers.payme ? "green" : "neutral"}>
                Payme{providers.payme ? "" : " (not set up)"}
              </Tag>
              <Tag tone={providers.click ? "green" : "neutral"}>
                Click{providers.click ? "" : " (not set up)"}
              </Tag>
            </div>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: SOFT,
                margin: 0,
                borderTop: "1px solid #D4D3CE",
                paddingTop: 12,
              }}
            >
              Card payments run through Stripe; Payme and Click cover Uzbekistan. A plan change
              takes effect once the payment is confirmed.
            </p>
          </Card>
        </Split>

        <Card>
          <CardHead title="Plans" />
          <CardNote>
            Center pricing is not on self-serve checkout yet — talk to us and we&apos;ll set your
            plan up directly.
          </CardNote>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 12,
            }}
          >
            {PLAN_ORDER.map((id) => (
              <PlanCard key={id} plan={id} currentPlan={sub.plan} providers={providers} />
            ))}
          </div>
        </Card>
      </Stack>
    </div>
  );
}

/** One usage meter on the dark plan card. */
function Usage({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null;
  return (
    <div style={{ background: RAIL.panel, borderRadius: 10, padding: "13px 14px" }}>
      <div style={{ fontFamily: SANS, fontSize: 11.5, color: RAIL.light }}>{label}</div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 18,
          fontWeight: 600,
          margin: "5px 0 9px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {used}
        <span style={{ fontSize: 13, fontWeight: 400, color: RAIL.light }}>
          {" "}
          / {limit == null ? "unmetered" : limit}
        </span>
      </div>
      <div style={{ height: 5, background: "#2B2A63", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            // No ceiling to fill: show a thin steady mint line rather than an
            // empty track that reads as "you have used nothing".
            width: pct == null ? "100%" : `${pct}%`,
            height: "100%",
            background: pct == null ? "rgba(127,216,168,.35)" : pct >= 80 ? RAIL.gold : RAIL.mint,
          }}
        />
      </div>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${isCurrent ? INDIGO : "#C5C4BE"}`,
        background: isCurrent ? "#FBFBFF" : "#fff",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: INK }}>
          {tier.name}
        </span>
        {isCurrent ? <Tag tone="indigo">Current</Tag> : null}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 600,
          color: INK,
          margin: "6px 0 2px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {tier.price == null ? "Custom" : `$${tier.price}`}
        {tier.price != null && tier.price > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/mo</span>
        ) : null}
      </div>
      {tier.priceUzs != null ? (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT }}>
          ≈ {tier.priceUzs.toLocaleString()} UZS/mo
        </div>
      ) : null}

      <ul
        style={{
          listStyle: "none",
          margin: "12px 0 0",
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {tier.features.map((f) => (
          <li key={f} style={{ fontFamily: SANS, fontSize: 12, color: SOFT, lineHeight: 1.45 }}>
            <span style={{ color: GREEN, marginRight: 6 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 14 }}>
        {isCurrent ? (
          <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
            You&apos;re on this plan.
          </span>
        ) : purchasable ? (
          <UpgradeButtons plan={plan} providers={providers} />
        ) : plan === "enterprise" ? (
          <a
            href="mailto:sales@engprogress.com"
            className="cn-link"
            style={{ fontFamily: SANS, fontSize: 12, color: INDIGO, textDecoration: "none" }}
          >
            Contact sales →
          </a>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>Default plan.</span>
        )}
      </div>
    </div>
  );
}
