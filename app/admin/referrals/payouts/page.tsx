import Link from "next/link";

import { Card, CardHead, Empty, FAINT, INK, LINE, MUTED, PageTitle, ROW_RULE, SANS, SOFT, Surface } from "@/app/admin/_components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { loadDuePayouts, loadPayoutHistory } from "@/lib/referrals/admin";
import { loadSettings } from "@/lib/referrals/service";
import { formatMoney, nextPayoutDate } from "@/lib/referrals/types";
import { BRAND } from "@/lib/theme/tokens";

import { PayRow } from "./_components/pay-row";

export const dynamic = "force-dynamic";

/**
 * Settling the month.
 *
 * THE SCREEN THAT MAKES "PAID OUT MONTHLY" TRUE. Everything else in this feature
 * accrues: commission is earned, held, cleared — and then, until this existed,
 * nothing. `referral_payouts` had no writer anywhere in the codebase, so
 * "Commission owed" was a number that only ever went up and the promise on the
 * learner's page had nothing behind it.
 *
 * Grouped by referrer AND currency, because that pair is what one payout row
 * settles. Nothing is summed across currencies here or anywhere else — Stripe
 * settles USD, the UZ gateways settle UZS, and there is no rate in this system
 * to merge them with.
 *
 * Below-floor balances are listed too, greyed and unpayable. Hiding them would
 * leave a reviewer wondering where somebody's money went; showing them says
 * plainly that it is accruing and simply has not reached the threshold.
 */
export default async function ReferralPayoutsPage() {
  await requireSuperAdmin();
  const [due, history, settings] = await Promise.all([
    loadDuePayouts(),
    loadPayoutHistory(),
    loadSettings(),
  ]);

  const ready = due.filter((d) => d.ready);
  const waiting = due.filter((d) => !d.ready);
  const payout = nextPayoutDate();

  return (
    <Surface>
      <Link
        href="/admin/referrals"
        style={{ fontFamily: SANS, fontSize: 13, color: BRAND, textDecoration: "none" }}
      >
        ← Referrals
      </Link>

      <div style={{ marginTop: 14 }}>
        <PageTitle
          eyebrow="Programme"
          title="Payouts"
          subtitle={`Cleared balances over ${formatMoney(settings.minPayoutMinor, "usd")} (${formatMoney(settings.minPayoutUzsMinor, "uzs")}) go out monthly — next on ${payout.toLocaleDateString("en", { day: "numeric", month: "long", timeZone: "UTC" })}.`}
        />
      </div>

      <Card style={{ marginBottom: 18 }}>
        <CardHead
          title={`Ready to pay (${ready.length})`}
          note="Recording a payout settles those commissions and emails the referrer. Move the money first — this writes down that you did."
        />
        {ready.length === 0 ? (
          <Empty>Nothing has cleared the floor yet.</Empty>
        ) : (
          ready.map((d) => <PayRow key={`${d.referralAccountId}:${d.currency}`} due={d} />)
        )}
      </Card>

      {waiting.length > 0 ? (
        <Card style={{ marginBottom: 18 }}>
          <CardHead
            title={`Still building (${waiting.length})`}
            note="Cleared the refund hold, but under the payout floor — accruing until it gets there"
          />
          {waiting.map((d) => (
            <PayRow key={`${d.referralAccountId}:${d.currency}`} due={d} />
          ))}
        </Card>
      ) : null}

      <Card>
        <CardHead title="Already paid" note="Newest first" />
        {history.length === 0 ? (
          <Empty>No payouts recorded yet.</Empty>
        ) : (
          history.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                gap: 14,
                padding: "12px 20px",
                borderTop: `1px solid ${ROW_RULE}`,
              }}
            >
              <span style={{ fontFamily: SANS, fontSize: 13.5, color: INK, minWidth: 170, flex: "1 1 170px" }}>
                {p.name}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: 600,
                  color: INK,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 100,
                  textAlign: "right",
                }}
              >
                {formatMoney(p.amountMinor, p.currency)}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: SOFT, minWidth: 150 }}>
                {p.reference ? `ref ${p.reference}` : "no reference recorded"}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginLeft: "auto" }}>
                {new Date(p.paidAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          ))
        )}
      </Card>

      <p style={{ fontFamily: SANS, fontSize: 12, color: FAINT, margin: "14px 0 0", maxWidth: "80ch", lineHeight: 1.55, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
        A payout records a transfer; it does not make one. The reference is the only durable link
        between a row here and the real bank or Payme transaction, so it is worth filling in even
        though nothing forces it. Amounts are never taken from the form — they are recomputed from
        the commissions that have actually cleared, so what is recorded is always what is owed.
      </p>
      <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED, margin: "8px 0 0" }}>
        Refunds arriving after a payout are left alone — see the note on <code>reverseCommission</code>.
      </p>
    </Surface>
  );
}
