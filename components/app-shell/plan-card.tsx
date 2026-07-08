import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { UsageSummary } from "@/lib/quota";

const SANS = "var(--font-hanken), system-ui, sans-serif";

/**
 * The learner's PLAN, pinned to the bottom of the sidebar rail (replaces the
 * old target-band card): current plan name, how much of the month's quota is
 * left (gradings + practice sets), and an Upgrade button when a higher tier
 * exists. Sits on the dark rail — quiet translucent tile, light-on-dark, same
 * palette as the nav (see sidebar-nav.tsx / shell.tsx).
 */
export function PlanCard({ usage }: { usage: UsageSummary }) {
  const upgradable = usage.plan !== "enterprise";
  return (
    <div
      className="lp-sb-target"
        style={{
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 14,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#9096B0",
          }}
        >
          Your plan
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 12,
            color: usage.plan === "trial" ? "#CDD1DF" : "#7CE3AE",
            background: usage.plan === "trial" ? "rgba(255,255,255,.09)" : "rgba(91,221,155,.13)",
            padding: "2px 9px",
            borderRadius: 999,
          }}
        >
          {usage.planName}
        </span>
      </div>

      <QuotaRow label="Gradings" used={usage.grade.used} limit={usage.grade.limit} />
      <QuotaRow label="Practice sets" used={usage.generate.used} limit={usage.generate.limit} />

      {upgradable ? (
        <Link
          href="/pricing"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            height: 34,
            marginTop: 2,
            borderRadius: 9,
            background: "#7C5CFC",
            color: "#fff",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 8px 18px -8px rgba(124,92,252,.65)",
          }}
        >
          Upgrade <ArrowUpRight size={14} />
        </Link>
      ) : null}
    </div>
  );
}

function QuotaRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const left = limit == null ? null : Math.max(0, limit - used);
  const frac = limit == null || limit === 0 ? 0 : Math.min(1, used / limit);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: SANS,
          fontSize: 12,
          color: "#CDD1DF",
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: left === 0 ? "#FCA5A5" : "#fff" }}>
          {limit == null ? "Unlimited" : `${left} left`}
        </span>
      </div>
      {limit != null ? (
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((1 - frac) * 100)}%`,
              borderRadius: 999,
              background: left === 0 ? "#F87171" : "#7CE3AE",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
