"use client";

import { useActionState } from "react";

import { markReferralPaid, type ReviewState } from "@/app/admin/actions";
import { INK, LINE, MUTED, SANS, TONE } from "@/components/admin/ui";
import { formatMoney } from "@/lib/referrals/types";
import type { DuePayout } from "@/lib/referrals/admin";
import { PANEL, WHITE } from "@/lib/theme/tokens";

const initial: ReviewState = {};

/**
 * One balance, and the button that settles it.
 *
 * TAKES NO AMOUNT. The sum is recomputed server-side from the commissions that
 * have actually cleared, so a reviewer cannot settle a different number than the
 * ledger says — not by typo, and not otherwise. The figure shown here is a
 * read; the figure written is derived.
 *
 * The reference field is the one input that matters. Money moves in a bank app
 * or a Payme dashboard, and this row only records that it did — so the transfer
 * id is the sole durable link between the two, and the only thing anybody can
 * reconcile against later.
 */
export function PayRow({ due }: { due: DuePayout }) {
  const [state, action, pending] = useActionState(markReferralPaid, initial);

  return (
    <form action={action} style={{ display: "contents" }}>
      <input type="hidden" name="account_id" value={due.referralAccountId} />
      <input type="hidden" name="currency" value={due.currency} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          padding: "14px 20px",
          borderTop: `1px solid ${LINE}`,
        }}
      >
        <div style={{ minWidth: 190, flex: "1 1 190px" }}>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: INK }}>{due.name}</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 2 }}>
            {due.code ? `code ${due.code} · ` : ""}
            {due.count} commission{due.count === 1 ? "" : "s"}
            {due.email ? "" : " · no email to notify"}
          </div>
        </div>

        <div
          style={{
            fontFamily: SANS,
            fontSize: 18,
            fontWeight: 700,
            color: due.ready ? INK : MUTED,
            fontVariantNumeric: "tabular-nums",
            minWidth: 110,
            textAlign: "right",
          }}
        >
          {formatMoney(due.amountMinor, due.currency)}
        </div>

        {due.ready ? (
          <>
            <input
              name="reference"
              placeholder="Transfer reference"
              aria-label="Transfer reference"
              style={{
                width: 180,
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                padding: "9px 12px",
                fontFamily: SANS,
                fontSize: 13,
                color: INK,
                background: PANEL,
              }}
            />
            <button
              type="submit"
              disabled={pending}
              style={{
                border: 0,
                background: TONE.green.ink,
                color: WHITE,
                borderRadius: 999,
                padding: "10px 22px",
                fontFamily: SANS,
                fontSize: 13.5,
                fontWeight: 600,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {pending ? "…" : "Mark paid"}
            </button>
          </>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, marginLeft: "auto" }}>
            under the payout floor — nothing goes out yet
          </span>
        )}

        {state.error ? (
          <div style={{ flexBasis: "100%", fontFamily: SANS, fontSize: 12.5, color: TONE.red.ink }} role="alert">
            {state.error}
          </div>
        ) : null}
        {state.notice ? (
          <div style={{ flexBasis: "100%", fontFamily: SANS, fontSize: 12.5, color: TONE.green.ink }} role="status">
            {state.notice}
          </div>
        ) : null}
      </div>
    </form>
  );
}
