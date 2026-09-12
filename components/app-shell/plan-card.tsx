import Link from "next/link";
import { Crown } from "lucide-react";

import { SANS } from "@/lib/theme/tokens";
import type { UsageSummary } from "@/lib/quota";

/**
 * The learner's PLAN, pinned to the bottom of the sidebar rail (replaces the
 * old target-band card): current plan name, how much of the month's quota is
 * left (gradings + practice sets), and an Upgrade button when a higher tier
 * exists.
 *
 * ⚠️ REPAINTED TWICE. It was light-on-dark (the rail was a burgundy panel),
 * then a grey tray on a white rail. The rail is warm paper now, so a grey tray
 * has nothing to sit against: this is the Base44 reference's "Upgrade your
 * plan" card — WHITE on the warm ground, hairline border, the crown on the
 * right — which is the one place in the rail where a raised surface still says
 * something, because everything around it is flat.
 *
 * The quota rows stay. The reference's card is a pure CTA, but this is the only
 * thing that tells a learner how much practice is left before they hit a wall,
 * and moving that behind a click to sell an upgrade harder is the wrong trade.
 */
/** The rail's single hue — the Base44 reference's orange, used ONLY on the
 *  upgrade CTA (and, in the shell, the unread dot). Everything else in the rail
 *  is warm grey; if a third thing wants this colour, one of these two should
 *  give it up. */
const ACCENT = "#d2571f";

export function PlanCard({ usage }: { usage: UsageSummary }) {
  const upgradable = usage.plan !== "enterprise";
  return (
    <div
      className="lp-sb-target"
      style={{
        background: "#fff",
        border: "1px solid #e7e4dc",
        borderRadius: 12,
        padding: 12,
        color: "#16150f",
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
            fontSize: 13.5,
            color: "#16150f",
          }}
        >
          {usage.planName}
        </span>
        <Crown size={16} strokeWidth={1.9} color={ACCENT} />
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
            // OUTLINED, NOT FILLED — the reference's upgrade button, and the
            // right weight here: the card is already the only raised surface in
            // a flat rail, so a solid block inside it is the second shout in a
            // row. The warm accent is the rail's ONE hue; everything else on
            // this surface is grey on purpose.
            background: "#fff",
            border: `1px solid ${ACCENT}`,
            color: ACCENT,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Upgrade your plan
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
          color: "#8b8883",
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: left === 0 ? "#b3261e" : "#16150f" }}>
          {limit == null ? "Unlimited" : `${left} left`}
        </span>
      </div>
      {limit != null ? (
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: "#eceae2",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.round((1 - frac) * 100)}%`,
              borderRadius: 999,
              background: left === 0 ? "#b3261e" : "#4a463d",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
