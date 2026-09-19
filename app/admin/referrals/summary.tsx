import Link from "next/link";

import { Card, FAINT, INK, LINE, MUTED, SANS, SERIF } from "@/components/admin/ui";
import { formatMoney, type CurrencyTotal } from "@/lib/referrals/types";
import { BRAND, BRAND_DARKEST, BRAND_PALE, HERO_A, HERO_B, WHITE } from "@/lib/theme/tokens";

/**
 * What the programme costs, and what it is holding.
 *
 * "OWED" LEADS BECAUSE IT IS A LIABILITY WITH NO SCREEN TO DISCHARGE IT. Nothing
 * in this build can mark a month settled — `referral_payouts` has no writer — so
 * this figure only goes up, and putting it first is the honest way to say that.
 * It counts money still on hold as well as money past it: a commission inside its
 * refund window is still a promise made.
 *
 * It is the one burgundy panel in an indigo console, because it belongs to the
 * referral programme rather than to the console, and a reviewer arriving from
 * the learner-side pages should recognise it.
 */
export function ProgrammeSummary({
  owed,
  waiting,
  oldestWaiting,
  active,
  referredSignups,
}: {
  owed: CurrencyTotal[];
  waiting: number;
  oldestWaiting: string | null;
  active: number;
  referredSignups: number;
}) {
  const unsettled = owed.filter((t) => t.pendingMinor + t.payableMinor > 0);
  const lead = unsettled[0] ?? null;
  const rest = unsettled.slice(1);

  return (
    <div
      className="sa-kpis"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,minmax(0,1fr))",
        gap: 14,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          borderRadius: 14,
          padding: "22px 24px",
          background: `linear-gradient(120deg, ${HERO_A} 0%, ${HERO_B} 100%)`,
          color: WHITE,
          border: `1px solid ${BRAND_DARKEST}`,
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            letterSpacing: ".12em",
            fontWeight: 600,
            textTransform: "uppercase",
            color: BRAND_PALE,
          }}
        >
          Commission owed
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 40,
            lineHeight: 1.1,
            marginTop: 8,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {lead ? formatMoney(lead.pendingMinor + lead.payableMinor, lead.currency) : "$0.00"}
        </div>
        <div style={{ fontSize: 13, color: BRAND_PALE, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
          {rest.length > 0
            ? /* A second balance, not a conversion of the first — there is no
                 rate in this system to convert with. */
              `and ${rest.map((t) => formatMoney(t.pendingMinor + t.payableMinor, t.currency)).join(" + ")}`
            : "held and cleared, not yet paid out"}
        </div>
        {/* The figure is a liability, so it links to the only screen that can
            discharge one. Reading a number you cannot act on is how it gets
            ignored until it is large. */}
        <Link
          href="/admin/referrals/payouts"
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "7px 16px",
            borderRadius: 999,
            background: "rgba(255,255,255,.18)",
            color: WHITE,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Settle payouts →
        </Link>
      </div>

      <Figure
        value={String(waiting)}
        label="Waiting for review"
        note={
          oldestWaiting
            ? `oldest applied ${relative(oldestWaiting)}`
            : "queue is clear"
        }
      />
      <Figure
        value={String(active)}
        label="Active partners"
        note={`${referredSignups} referred signup${referredSignups === 1 ? "" : "s"}`}
      />
    </div>
  );
}

function Figure({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <Card style={{ padding: "22px 24px", border: `1px solid ${LINE}` }}>
      <div
        style={{
          fontSize: 11.5,
          letterSpacing: ".12em",
          fontWeight: 600,
          textTransform: "uppercase",
          color: MUTED,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 40,
          lineHeight: 1.1,
          marginTop: 8,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: FAINT, marginTop: 2 }}>{note}</div>
    </Card>
  );
}

/** "2 days ago" — a queue is read in elapsed time, not in dates. */
function relative(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
