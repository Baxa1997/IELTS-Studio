import {
  BRAND,
  BRAND_DARKEST,
  BRAND_MID,
  BRAND_PALE,
  SANS,
  SERIF,
  WHITE,
} from "@/lib/theme/tokens";
import {
  formatMoney,
  nextPayoutDate,
  payoutFloor,
  type CurrencyTotal,
  type ReferralSettings,
} from "@/lib/referrals/types";

import { ShareCard } from "./share-card";

/**
 * The dashboard hero: what you have earned, and the link that earns it.
 *
 * TWO CURRENCIES, NEVER ONE FIGURE. The design stacked a dollar total with a
 * som total beneath it, converted at about 12,500 — there is no exchange rate
 * anywhere in this system, and inventing one would produce a number that is
 * wrong in both currencies and drifts further every week. Stripe settles USD and
 * the UZ gateways settle UZS; they are two balances, so they are shown as two.
 *
 * The link sits INSIDE the hero rather than under it because it is the only
 * thing on this page that is an action. Everything below reports on it.
 */
export function EarningsHero({
  totals,
  settings,
  url,
  code,
}: {
  totals: CurrencyTotal[];
  settings: ReferralSettings;
  url: string;
  code: string;
}) {
  const payout = nextPayoutDate();
  // The headline balance is the one with the most in it, so a referrer who has
  // earned in both currencies still leads with the number they care about.
  const lead =
    [...totals].sort(
      (a, b) =>
        b.pendingMinor +
        b.payableMinor +
        b.paidMinor -
        (a.pendingMinor + a.payableMinor + a.paidMinor),
    )[0] ?? null;
  const rest = totals.filter((t) => t.currency !== lead?.currency);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        padding: "26px 32px 26px",
        background: `linear-gradient(120deg, ${BRAND_DARKEST} 0%, ${BRAND} 58%, ${BRAND_MID} 100%)`,
        color: WHITE,
        marginTop: 18,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          right: -70,
          width: 380,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.13), transparent 62%)",
        }}
      />

      <div
        className="lp-hero-split"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(240px,auto)",
          gap: 30,
          alignItems: "end",
        }}
      >
        <div>
          <Eyebrow>Earned all time</Eyebrow>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(52px,7vw,64px)",
              lineHeight: 0.95,
              letterSpacing: "-.02em",
              margin: "10px 0 0",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {lead
              ? formatMoney(lead.pendingMinor + lead.payableMinor + lead.paidMinor, lead.currency)
              : "$0.00"}
          </div>
          {rest.map((t) => (
            <div
              key={t.currency}
              style={{
                fontFamily: SANS,
                fontSize: 17,
                color: "rgba(255,255,255,.82)",
                marginTop: 6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {/* A separate balance, not a conversion of the one above. */}
              and {formatMoney(t.pendingMinor + t.payableMinor + t.paidMinor, t.currency)}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            paddingBottom: 6,
            minWidth: 240,
          }}
        >
          {lead ? (
            <>
              <Line label="Available now" value={formatMoney(lead.payableMinor, lead.currency)} />
              <Line
                label={`On ${settings.holdDays}-day hold`}
                value={formatMoney(lead.pendingMinor, lead.currency)}
              />
              <Line
                label="Next payout"
                value={
                  lead.payableMinor >= payoutFloor(settings, lead.currency)
                    ? payout.toLocaleDateString("en", {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })
                    : "—"
                }
                last
              />
            </>
          ) : (
            <Line label="Next payout" value="—" last />
          )}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          marginTop: 28,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,.2)",
        }}
      >
        <ShareCard url={url} code={code} />
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".15em",
        textTransform: "uppercase",
        color: BRAND_PALE,
      }}
    >
      {children}
    </div>
  );
}

function Line({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 22,
        fontFamily: SANS,
        fontSize: 14.5,
        paddingBottom: last ? 0 : 8,
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,.18)",
      }}
    >
      <span style={{ color: BRAND_PALE }}>{label}</span>
      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
