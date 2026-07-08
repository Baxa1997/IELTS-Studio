import Link from "next/link";
import { Zap } from "lucide-react";

import type { UsageSummary } from "@/lib/quota";

const SANS = "var(--font-hanken), system-ui, sans-serif";

/**
 * Slim limits strip across the top of the content surface. The shell renders
 * it ONLY while the sidebar rail is collapsed — when the rail is open the
 * PlanCard already shows the same numbers, so the two never double up.
 * Normal document flow (not floating), so it can never overlap a hub's own
 * header buttons.
 */
export function QuotaBar({ usage }: { usage: UsageSummary }) {
  if (usage.generate.limit == null && usage.grade.limit == null) return null; // enterprise
  const practices = usage.generate.remaining ?? 0;
  const gradings = usage.grade.remaining ?? 0;
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
          {" — "}
          <strong style={{ color: empty && practices === 0 ? "#DC2626" : "#1C1B2E" }}>
            {practices}
          </strong>{" "}
          practice sets ·{" "}
          <strong style={{ color: empty && gradings === 0 ? "#DC2626" : "#1C1B2E" }}>
            {gradings}
          </strong>{" "}
          gradings left this month
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
