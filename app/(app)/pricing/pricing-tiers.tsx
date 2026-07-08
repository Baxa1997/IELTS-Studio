"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

import { PLAN_ORDER, PLAN_TIERS, type OrgPlan } from "@/lib/billing/plans";
import type { UsageSummary } from "@/lib/quota";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#4338CA";
const VIOLET = "#7C5CFC";

/** Start checkout for any paid plan (Stripe via /api/billing/checkout). */
function useCheckout() {
  const [busyPlan, setBusyPlan] = useState<OrgPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(plan: OrgPlan) {
    if (busyPlan) return;
    setBusyPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, provider: "stripe" }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.href = body.url;
        return;
      }
      setError(
        body.error === "stripe_unavailable"
          ? "Card payments aren't enabled yet — please check back soon."
          : "Couldn't start the checkout — please try again.",
      );
    } catch {
      setError("Network error — please try again.");
    }
    setBusyPlan(null);
  }

  return { busyPlan, error, start };
}

export function PricingTiers({
  currentPlan,
  usage,
}: {
  currentPlan: OrgPlan;
  usage: UsageSummary;
}) {
  const { busyPlan, error, start } = useCheckout();
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  return (
    <div style={{ fontFamily: SANS, maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ margin: "10px 0 6px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 600, margin: 0, color: "#1C1B2E" }}>
          Plans
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "#56556A" }}>
          You&rsquo;re on <strong>{PLAN_TIERS[currentPlan].name}</strong>
          {usage.generate.limit != null
            ? ` — ${usage.generate.remaining} practice sets and ${usage.grade.remaining} gradings left this month.`
            : " — unlimited practice and grading."}
        </p>
        {error ? (
          <p role="alert" style={{ margin: "10px 0 0", fontSize: 13, color: "#B4231F" }}>
            {error}
          </p>
        ) : null}
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
          marginTop: 18,
        }}
      >
        {PLAN_ORDER.map((id) => {
          const tier = PLAN_TIERS[id];
          const isCurrent = id === currentPlan;
          const isUpgrade = PLAN_ORDER.indexOf(id) > currentIdx;
          const highlight = id === "pro";
          return (
            <section
              key={id}
              aria-current={isCurrent ? "true" : undefined}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "#fff",
                border: isCurrent ? `2px solid ${VIOLET}` : "1px solid #E9E7F2",
                borderRadius: 16,
                padding: "22px 20px",
                boxShadow: highlight
                  ? "0 18px 40px -24px rgba(67,56,202,.35)"
                  : "0 1px 2px rgba(20,20,48,.04)",
              }}
            >
              {isCurrent ? (
                <span
                  style={{
                    position: "absolute",
                    top: -11,
                    left: 18,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    color: "#fff",
                    background: VIOLET,
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  CURRENT PLAN
                </span>
              ) : highlight ? (
                <span
                  style={{
                    position: "absolute",
                    top: -11,
                    left: 18,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    color: INDIGO,
                    background: "#EEF0FE",
                    border: "1px solid #DDDCF4",
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  MOST POPULAR
                </span>
              ) : null}

              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1C1B2E" }}>{tier.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
                  <span style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 600, color: "#1C1B2E" }}>
                    {tier.price === 0 ? "$0" : `$${tier.price}`}
                  </span>
                  <span style={{ fontSize: 13, color: "#8A88A0" }}>/ month</span>
                </div>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8, flex: 1 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 13.5, color: "#3E3D52" }}>
                    <Check size={15} style={{ color: "#16A34A", flex: "none", marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "11px 0",
                    borderRadius: 11,
                    background: "#F4F3FB",
                    color: "#6B6A80",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Your current plan
                </div>
              ) : isUpgrade ? (
                <button
                  type="button"
                  onClick={() => void start(id)}
                  disabled={busyPlan != null}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "11px 0",
                    borderRadius: 11,
                    border: "none",
                    background: highlight ? INDIGO : "#1C1B2E",
                    color: "#fff",
                    fontFamily: SANS,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: busyPlan ? "default" : "pointer",
                  }}
                >
                  {busyPlan === id ? (
                    <>
                      <Loader2 className="animate-spin" size={15} /> Opening checkout…
                    </>
                  ) : (
                    <>
                      Upgrade to {tier.name} <ArrowRight size={15} />
                    </>
                  )}
                </button>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "11px 0",
                    borderRadius: 11,
                    border: "1px dashed #E0DEEE",
                    color: "#8A88A0",
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  Included in your plan
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p style={{ margin: "18px 0 0", fontSize: 12.5, color: "#8A88A0" }}>
        Plans renew monthly and can be cancelled anytime. Prices in USD; local payment
        options (Payme / Click) are available at checkout equivalents.
      </p>
    </div>
  );
}
