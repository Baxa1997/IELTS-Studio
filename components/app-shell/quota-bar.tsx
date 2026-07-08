import Link from "next/link";
import { Zap } from "lucide-react";

import type { UsageSummary } from "@/lib/quota";

const SANS = "var(--font-hanken), system-ui, sans-serif";

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
        background: empty ? "#FEF5F5" : "#F8F7FE",
        borderBottom: `1px solid ${empty ? "#F5D9D9" : "#EAE8F6"}`,
        fontFamily: SANS,
        fontSize: 13,
        color: "#56556A",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Zap size={14} style={{ color: empty ? "#DC2626" : "#7C5CFC", flex: "none" }} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <strong style={{ color: "#1C1B2E" }}>{usage.planName}</strong>
          {empty ? " — you're out of " : " — running low: "}
          {empty ? (
            <strong style={{ color: "#DC2626" }}>
              {practices === 0 ? "practice sets" : "gradings"}
            </strong>
          ) : null}
          {empty ? " for this month" : null}
          {!empty ? (
            <>
              <strong style={{ color: "#1C1B2E" }}>
                {Number.isFinite(practices) ? practices : "unlimited"}
              </strong>{" "}
              practice sets ·{" "}
              <strong style={{ color: "#1C1B2E" }}>
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
          color: "#fff",
          background: "#7C5CFC",
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
