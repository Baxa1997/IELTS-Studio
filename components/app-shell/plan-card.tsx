import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SANS } from "@/lib/theme/tokens";
import type { UsageSummary } from "@/lib/quota";

/**
 * The learner's PLAN, pinned to the bottom of the sidebar rail (replaces the
 * old target-band card): current plan name, how much of the month's quota is
 * left (gradings + practice sets), and an Upgrade button when a higher tier
 * exists.
 *
 * ⚠️ REPAINTED FOR A WHITE RAIL. Every colour in here used to be light-on-dark
 * — a translucent white fill, `#B08E9B` labels, a `#F2C3D3` button — because
 * the rail was a solid burgundy panel. The rail is now the design's white card,
 * and none of that survives the change: a white-on-white card with pale pink
 * text is invisible, and this is the one thing in the rail that tells a learner
 * how much practice they have left. It now dresses as a tray, like the nav
 * groups above it.
 */
export function PlanCard({ usage }: { usage: UsageSummary }) {
  const upgradable = usage.plan !== "enterprise";
  return (
    <div
      className="lp-sb-target"
      style={{
        background: "#f6f6f3",
        border: "1px solid #e6e4dc",
        borderRadius: 12,
        padding: 12,
        color: "#16232b",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#9aa0a6",
          }}
        >
          Your plan
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 11.5,
            color: usage.plan === "trial" ? "#6b7178" : "#3b36c9",
            background: usage.plan === "trial" ? "#eceae3" : "#e7eafb",
            padding: "2px 9px",
            borderRadius: 999,
          }}
        >
          {usage.planName}
        </span>
      </div>

      <QuotaRow label="Gradings" used={usage.grade.used} limit={usage.grade.limit} />
      <QuotaRow label="Practice sets" used={usage.generate.used} limit={usage.generate.limit} />
      {/* Speaking mocks are counted separately because they are separately
          expensive — a live 3-part exam is real audio minutes, not a text call.
          A trial gets exactly one, so "1 left" is the whole allowance. */}
      <QuotaRow label="Speaking mocks" used={usage.speaking.used} limit={usage.speaking.limit} />

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
            // Solid indigo on the grey tray. The old light-fill/dark-ink
            // inversion existed only because a burgundy button would have
            // vanished into a burgundy rail; against #f6f6f3 the filled button
            // is both legible and the loudest thing in the card, which is what
            // an upgrade CTA should be.
            background: "#3b36c9",
            color: "#fff",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 6px 14px -8px rgba(59,54,201,.7)",
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
          color: "#6b7178",
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 700, color: left === 0 ? "#b3261e" : "#16232b" }}>
          {limit == null ? "Unlimited" : `${left} left`}
        </span>
      </div>
      {limit != null ? (
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: "#e0ded6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((1 - frac) * 100)}%`,
              borderRadius: 999,
              background: left === 0 ? "#b3261e" : "#3b36c9",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
