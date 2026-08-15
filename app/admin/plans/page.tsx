import Link from "next/link";

import {
  Bar,
  Card,
  CardHead,
  FAINT,
  INDIGO,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  NAVY,
  Notice,
  Pill,
  PageTitle,
  SERIF,
  SOFT,
  Split,
  Surface,
  TONE,
} from "@/components/admin/ui";
import { loadRevenue } from "@/lib/admin/revenue";
import { requireSuperAdmin } from "@/lib/auth";
import { PLAN_ORDER, PLAN_TIERS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const money = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;

const cap = (n: number | null) => (n == null ? "Unlimited" : String(n));

/**
 * What each plan allows, and what it actually earns.
 *
 * THE HONEST NUMBER IS THE POINT. Two sources disagree about who is paying —
 * `organizations.plan` (what an account may do) and `subscriptions.status`
 * (whether money arrives) — and this page shows both rather than picking the
 * flattering one. The gap is real information: accounts on paid limits that
 * nobody is billing, whether comped deliberately or a checkout that died.
 */
export default async function PlansPage() {
  await requireSuperAdmin();
  const revenue = await loadRevenue();

  const historyMax = Math.max(1, ...revenue.history.map((m) => m.mrr));
  const last = revenue.history[revenue.history.length - 1]?.mrr ?? 0;
  const prev = revenue.history[revenue.history.length - 2]?.mrr ?? 0;
  const growth = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

  return (
    <Surface>
      <PageTitle
        eyebrow="Operations"
        title="Plans & revenue"
        subtitle="What each plan allows, and what it earns. Limits come from lib/billing/plans.ts — the same file the app and the engine enforce."
      />

      <KpiRow cols={4}>
        <Kpi
          label="Monthly recurring"
          value={money(revenue.mrr)}
          delta={growth == null ? undefined : `${growth >= 0 ? "+" : ""}${growth}%`}
          deltaTone={growth != null && growth >= 0 ? "green" : "red"}
          sub="from live subscriptions"
          accent={TONE.green.ink}
        />
        <Kpi
          label="Paying accounts"
          value={revenue.payingAccounts}
          delta={`${revenue.totalAccounts ? Math.round((revenue.payingAccounts / revenue.totalAccounts) * 100) : 0}%`}
          deltaTone="amber"
          sub={`of ${revenue.totalAccounts}`}
          accent={INDIGO}
        />
        <Kpi
          label="On paid limits, unbilled"
          value={revenue.unpaidPaidPlans}
          sub="comped, or never completed"
          accent={revenue.unpaidPaidPlans > 0 ? TONE.amber.ink : TONE.green.ink}
        />
        <Kpi
          label="Abandoned checkouts"
          value={revenue.incompleteSubscriptions}
          sub="started, never finished"
          accent={revenue.incompleteSubscriptions > 0 ? TONE.red.ink : TONE.green.ink}
        />
      </KpiRow>

      {revenue.unpaidPaidPlans > 0 ? (
        <Notice
          tone="amber"
          title={`${revenue.unpaidPaidPlans} account${revenue.unpaidPaidPlans === 1 ? " is" : "s are"} on a paid plan with no live subscription`}
          detail={
            <>
              Granting a plan by hand and taking payment are separate things, and they have drifted
              apart: the plan column would imply {money(revenue.grantedMrr)} a month, while{" "}
              {money(revenue.mrr)} is actually being billed. That is fine if those are deliberate
              comps — worth checking if not.
            </>
          }
          action={
            <Link
              href="/admin/users?plan=pro"
              style={{
                background: "#fff",
                border: `1px solid ${TONE.amber.border}`,
                borderRadius: 8,
                padding: "8px 13px",
                fontSize: 12.5,
                fontWeight: 500,
                color: "#8A5B12",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              See paid accounts
            </Link>
          }
        />
      ) : null}

      {/* ── the plans themselves ───────────────────────────────────────── */}
      <div
        className="ad-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {PLAN_ORDER.map((key) => {
          const tier = PLAN_TIERS[key];
          const line = revenue.lines.find((l) => l.plan === key);
          const dark = key === "pro";
          return (
            <section
              key={key}
              style={{
                background: dark ? NAVY : "#fff",
                border: `1px solid ${dark ? NAVY : "#E7E5DF"}`,
                borderRadius: 14,
                padding: 18,
                color: dark ? "#fff" : INK,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {tier.name}
                </h2>
                <span style={{ marginLeft: "auto" }}>
                  {dark ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        borderRadius: 20,
                        padding: "2px 9px",
                        background: "#2B2A63",
                        color: "#C9C7E4",
                      }}
                    >
                      most popular
                    </span>
                  ) : (
                    <Pill tone={key === "trial" ? "neutral" : "indigo"}>
                      {line?.paying ?? 0} paying
                    </Pill>
                  )}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "12px 0 4px" }}>
                <div style={{ fontSize: 26, fontWeight: 600 }}>
                  {tier.price ? `$${tier.price}` : "Free"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {tier.price ? (tier.months > 1 ? `/ ${tier.months} months` : "/ month") : ""}
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 14 }}>
                {line?.granted ?? 0} account{(line?.granted ?? 0) === 1 ? "" : "s"} ·{" "}
                {money(line?.mrr ?? 0)} a month
              </div>

              {[
                { k: "Gradings", v: cap(tier.gradeLimit) },
                { k: "Practice sets", v: cap(tier.generateLimit) },
                { k: "Live mocks", v: cap(tier.fullMockLimit) },
                { k: "Seats", v: cap(tier.seatLimit) },
              ].map((l) => (
                <div
                  key={l.k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderTop: `1px solid ${dark ? "#24234F" : "#F0EEE9"}`,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ opacity: 0.75 }}>{l.k}</span>
                  <span style={{ fontWeight: 600 }}>{l.v}</span>
                </div>
              ))}

              <div
                style={{
                  marginTop: 12,
                  fontSize: 11.5,
                  opacity: 0.65,
                  lineHeight: 1.5,
                }}
              >
                {tier.stripePriceId ? "Live Stripe price pinned." : "No Stripe price — not sold."}
              </div>
            </section>
          );
        })}
      </div>

      <Split ratio="1.3fr .7fr">
        <Card pad>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, margin: 0, color: INK }}>
              Recurring revenue
            </h2>
            <span style={{ fontSize: 12.5, color: SOFT }}>last 8 months</span>
            {growth != null ? (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: growth >= 0 ? TONE.green.ink : TONE.red.ink,
                }}
              >
                {growth >= 0 ? "+" : ""}
                {growth}% MoM
              </span>
            ) : null}
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: FAINT, lineHeight: 1.5 }}>
            Reconstructed from when each live subscription started. A subscription that ran and then
            cancelled leaves no row, so earlier months read slightly low — the full picture needs the
            invoice history from Stripe.
          </p>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 170, marginTop: 18 }}>
            {revenue.history.map((m) => (
              <div
                key={m.month}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "flex-end",
                  height: "100%",
                }}
              >
                <div style={{ fontSize: 11.5, color: SOFT }}>{m.mrr > 0 ? money(m.mrr) : ""}</div>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "6px 6px 2px 2px",
                    background: m.mrr > 0 ? INDIGO : "#EFEEE9",
                    height: `${Math.max(2, (m.mrr / historyMax) * 100)}%`,
                  }}
                />
                <div style={{ fontSize: 11.5, color: FAINT }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Conversion" note="How far accounts get from signing up to paying." />
          {revenue.funnel.map((f) => (
            <div key={f.stage} style={{ padding: "12px 18px", borderBottom: "1px solid #F5F4F0" }}>
              <div style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: INK }}>{f.stage}</span>
                <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: INK }}>
                  {f.n}
                </span>
                <span style={{ fontSize: 11.5, color: FAINT, marginLeft: 8 }}>
                  {Math.round(f.share * 100)}%
                </span>
              </div>
              <Bar
                width={`${Math.max(1, f.share * 100)}%`}
                fill={f.share > 0.5 ? INDIGO : f.share > 0.05 ? "#7C79DB" : "#E5A85C"}
              />
            </div>
          ))}
          <div style={{ padding: "14px 18px", fontSize: 12, color: MUTED, lineHeight: 1.55 }}>
            Every account starts free and stays free until someone chooses to pay. The drop between
            the last two rows is the one worth attacking.
          </div>
        </Card>
      </Split>
    </Surface>
  );
}
