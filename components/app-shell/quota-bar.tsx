import Link from "next/link";
import { Zap } from "lucide-react";

import { BRAND, BRAND_FILL, SANS, SLATE_BODY, SLATE_INK, WHITE } from "@/lib/theme/tokens";
import type { UsageSummary } from "@/lib/quota";

/** Show the warning once any limited counter has this many (or fewer) left. */
const LOW_THRESHOLD = 10;

/**
 * Low-quota warning strip across the top of the content surface. Renders on
 * every shell page, but ONLY once gradings or practice sets are running low
 * (≤ LOW_THRESHOLD left) — plenty of quota means no strip at all. Normal
 * document flow (not floating), so it can never overlap a hub's own header.
 */
export function QuotaBar({ usage }: { usage: UsageSummary }) {
  if (usage.generate.limit == null && usage.grade.limit == null) return null; // enterprise
  const practices = usage.generate.remaining ?? Number.POSITIVE_INFINITY;
  const gradings = usage.grade.remaining ?? Number.POSITIVE_INFINITY;
  if (practices > LOW_THRESHOLD && gradings > LOW_THRESHOLD) return null;
  const empty = practices === 0 || gradings === 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 18px",
        background: empty ? "#FEF5F5" : "#FDF4F7",
        borderBottom: `1px solid ${empty ? "#F5D9D9" : "#F0D3DE"}`,
        fontFamily: SANS,
        fontSize: 13,
        color: SLATE_BODY,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Zap size={14} style={{ color: empty ? "#DC2626" : "#7D0132", flex: "none" }} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <strong style={{ color: SLATE_INK }}>{usage.planName}</strong>
          {empty ? " — you're out of " : " — running low: "}
          {empty ? (
            <strong style={{ color: "#DC2626" }}>
              {practices === 0 ? "practice sets" : "gradings"}
            </strong>
          ) : null}
          {empty ? " for this month" : null}
          {!empty ? (
            <>
              <strong style={{ color: SLATE_INK }}>
                {Number.isFinite(practices) ? practices : "unlimited"}
              </strong>{" "}
              practice sets ·{" "}
              <strong style={{ color: SLATE_INK }}>
                {Number.isFinite(gradings) ? gradings : "unlimited"}
              </strong>{" "}
              gradings left this month
            </>
          ) : null}
        </span>
      </span>
      <Link
        href="/pricing"
        style={{
          flex: "none",
          fontWeight: 700,
          fontSize: 12.5,
          color: WHITE,
          background: BRAND_FILL,
          borderRadius: 999,
          padding: "4px 13px",
          textDecoration: "none",
        }}
      >
        Upgrade
      </Link>
    </div>
  );
}
