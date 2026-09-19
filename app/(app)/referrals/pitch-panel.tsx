import { BRAND, BRAND_PALE, HERO_A, HERO_B, HERO_C, SANS, SERIF, WHITE } from "@/lib/theme/tokens";
import { commissionRange, formatMoney, type ReferralSettings } from "@/lib/referrals/types";

/**
 * The offer, as a single panel.
 *
 * ONE NUMBER CARRIES THIS SCREEN — the rate — so it is set at display size and
 * everything else is a footnote under a rule. The three figures at the bottom
 * are the terms a person would otherwise have to read a paragraph to find, and
 * they are here because the two that are easy to leave out (a hold, a floor) are
 * exactly the two that cause a complaint later.
 *
 * The per-upgrade range is DERIVED FROM THE REAL PRICE LIST, not written down.
 * The design mocked "$14.85, typical annual upgrade"; there is no annual plan
 * and the true ceiling is $4.50. A number nobody can earn is the same mistake as
 * an inflated band — forgiven until the first payout, never after it.
 */
export function PitchPanel({ percent, settings }: { percent: number; settings: ReferralSettings }) {
  const { minMinor, maxMinor } = commissionRange(percent);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        padding: "34px 32px",
        background: `linear-gradient(120deg, ${HERO_A} 0%, ${HERO_B} 58%, ${HERO_C} 100%)`,
        color: WHITE,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 28,
        minHeight: 320,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -110,
          right: -60,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.13), transparent 62%)",
        }}
      />
      <div style={{ position: "relative" }}>
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
          Referral programme
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(64px,8vw,92px)",
            lineHeight: 0.95,
            letterSpacing: "-.02em",
            margin: "14px 0 8px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {percent}%
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 17,
            lineHeight: 1.45,
            color: "rgba(255,255,255,.88)",
            margin: 0,
            maxWidth: "26ch",
          }}
        >
          of the first payment every person you bring in makes. Once each, on any plan.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          gap: 26,
          flexWrap: "wrap",
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,.2)",
        }}
      >
        <Term
          value={`${formatMoney(minMinor, "usd")}–${formatMoney(maxMinor, "usd")}`}
          label="your cut, by their plan"
        />
        <Term value={`${settings.holdDays} days`} label="refund hold" />
        <Term value={formatMoney(settings.minPayoutMinor, "usd")} label="monthly payout floor" />
      </div>
    </div>
  );
}

function Term({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: BRAND_PALE, marginTop: 2 }}>{label}</div>
    </div>
  );
}
