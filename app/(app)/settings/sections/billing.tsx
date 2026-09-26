import Link from "next/link";

import { getSubscription } from "@/lib/billing/service";
import { getUsageSummary, type Quota } from "@/lib/quota";

import { Panel } from "./frame";
import {
  BRAND,
  BRAND_FILL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  WHITE,
} from "@/lib/theme/tokens";


const STATUS: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Ended",
  incomplete: "Waiting for payment",
};

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The learner's plan, when it renews, and what they have used this month. */
export async function LearnerBillingSection({ organizationId }: { organizationId: string }) {
  const [usage, sub] = await Promise.all([
    getUsageSummary(organizationId),
    getSubscription(organizationId),
  ]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel title="Your plan">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: INK }}>{usage.planName}</div>
            <div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>
              {STATUS[sub.status] ?? sub.status}
              {sub.currentPeriodEnd
                ? ` · ${sub.status === "canceled" ? "ended" : sub.provider === "stripe" ? "renews" : "ends"} ${date(sub.currentPeriodEnd)}`
                : ""}
            </div>
          </div>
          <Link
            href="/pricing"
            style={{
              marginLeft: "auto",
              padding: "10px 18px",
              borderRadius: 11,
              background: BRAND_FILL,
              color: WHITE,
              fontSize: 14.5,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {usage.plan === "trial" ? "Upgrade" : "Change plan"}
          </Link>
        </div>
      </Panel>

      <Panel title="This month" note={`Counts reset on ${date(usage.grade.resetAt)}.`}>
        <div style={{ display: "grid", gap: 14 }}>
          <Meter label="Essays graded" quota={usage.grade} />
          <Meter label="Practice generated" quota={usage.generate} />
          <Meter label="Full speaking mocks" quota={usage.speaking} />
        </div>
      </Panel>
    </div>
  );
}

function Meter({ label, quota }: { label: string; quota: Quota }) {
  const pct =
    quota.limit && quota.limit > 0
      ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
      : null;
  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}
      >
        <span style={{ color: INK, fontWeight: 600 }}>{label}</span>
        <span style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>
          {quota.used} / {quota.limit == null ? "unlimited" : quota.limit}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "#EFEDE8", overflow: "hidden" }}>
        <div
          style={{
            width: pct == null ? "100%" : `${pct}%`,
            height: "100%",
            background: pct == null ? "#E3A7BD" : quota.exceeded ? "#A13A2C" : BRAND,
          }}
        />
      </div>
    </div>
  );
}
