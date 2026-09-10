"use client";

import { useActionState } from "react";

import { reviewReferral, type ReviewState } from "@/app/admin/actions";
import { INK, LINE, MUTED, SANS, TONE } from "@/components/admin/ui";
import type { ReferralAccount } from "@/lib/referrals/types";

const initial: ReviewState = {};

/**
 * The decision, and the rate it is taken at.
 *
 * ONE FORM, several submit buttons — so the row still works before JavaScript
 * arrives, and so the note and the rate travel with whichever button was
 * pressed. The buttons on offer depend on where the account already is: an
 * undecided one can be approved or rejected, a live one can be closed or
 * revoked, and a rejected one offers nothing, because `profile_id` is unique on
 * `referral_accounts` and there is no second application to act on.
 *
 * THE RATE FIELD ONLY APPEARS BEFORE APPROVAL. `percent_applied` is copied onto
 * each commission as it accrues, so editing this afterwards would change what
 * future referrals earn while leaving the ledger untouched — a split between
 * what the page says and what was paid that nobody would notice for a month.
 */
export function DecisionBar({ account, defaultPercent }: { account: ReferralAccount; defaultPercent: number }) {
  const [state, action, pending] = useActionState(reviewReferral, initial);
  const live = account.status === "active";
  const undecided = account.status === "pending";

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "flex-end" }}>
      <input type="hidden" name="account_id" value={account.id} />

      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        {undecided ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 13, color: MUTED }}>
            Rate
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <input
                name="percent"
                type="number"
                min={1}
                max={100}
                step="0.5"
                defaultValue={account.percent ?? defaultPercent}
                aria-label="Commission rate, percent"
                style={{
                  width: 64,
                  border: `1px solid ${LINE}`,
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontFamily: SANS,
                  fontSize: 13,
                  color: INK,
                  background: "#FBFAF9",
                  textAlign: "center",
                }}
              />
              <span style={{ marginLeft: 5 }}>%</span>
            </span>
          </label>
        ) : null}

        <input
          name="note"
          placeholder={undecided ? "Note to them (optional)" : "Reason (optional)"}
          aria-label="Note"
          style={{
            width: 220,
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: "9px 12px",
            fontFamily: SANS,
            fontSize: 13,
            color: INK,
            background: "#fff",
          }}
        />

        {undecided ? (
          <>
            <Decide value="reject" tone="neutral" label="Reject" pending={pending} />
            <Decide value="approve" tone="green" label="Approve" pending={pending} primary />
          </>
        ) : null}
        {live ? (
          <>
            <Decide value="close" tone="neutral" label="Close" pending={pending} />
            {/* Destructive, and named for what it does to the money. */}
            <Decide value="revoke" tone="red" label="Revoke" pending={pending} />
          </>
        ) : null}
      </div>

      {undecided ? (
        <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED }}>
          Approving mints their code and emails it to them.
        </span>
      ) : null}

      {state.error ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: TONE.red.ink }} role="alert">
          {state.error}
        </div>
      ) : null}
      {state.notice ? (
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: TONE.green.ink }} role="status">
          {state.notice}
        </div>
      ) : null}
    </form>
  );
}

function Decide({
  value,
  tone,
  label,
  pending,
  primary,
}: {
  value: string;
  tone: "green" | "red" | "neutral";
  label: string;
  pending: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="submit"
      name="decision"
      value={value}
      disabled={pending}
      style={{
        border: primary ? 0 : `1px solid ${TONE[tone].border}`,
        background: primary ? TONE[tone].ink : "#fff",
        color: primary ? "#fff" : TONE[tone].ink,
        borderRadius: 999,
        padding: primary ? "10px 24px" : "9px 20px",
        fontFamily: SANS,
        fontSize: 13.5,
        fontWeight: primary ? 600 : 500,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
