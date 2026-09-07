"use client";

import { useActionState } from "react";

import { reviewReferral } from "@/app/admin/actions";
import type { ReviewState } from "@/app/admin/actions";
import { Glyph, INK, Pill, SOFT, TONE, clip } from "@/components/admin/ui";
import type { ReferralAccount } from "@/lib/referrals/types";

const initialState: ReviewState = {};

/**
 * One referral application, with the decision attached.
 *
 * THE PITCH IS THE ROW, not a detail behind a click. It is the only thing a
 * reviewer has to go on — a free account has no history — so hiding it would
 * leave two buttons and nothing to base them on, which is how a review queue
 * turns into a rubber stamp.
 *
 * Plain submit buttons on one form, so the row works before JavaScript arrives.
 */
export function ReferralReviewRow({ account }: { account: ReferralAccount }) {
  const [state, formAction, pending] = useActionState(reviewReferral, initialState);
  const live = account.status === "active";
  const decided = account.status !== "pending";
  const name = account.applicantName ?? account.applicantEmail ?? "Someone";

  return (
    <form
      action={formAction}
      className="sa-row"
      style={{ padding: "14px 18px", borderBottom: "1px solid #F5F4F0" }}
    >
      <input type="hidden" name="account_id" value={account.id} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <Glyph tone={live ? "green" : decided ? "neutral" : "indigo"} size={34}>
          {name.slice(0, 2).toUpperCase()}
        </Glyph>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{name}</span>
            {account.code ? <Pill tone="green">{account.code}</Pill> : null}
            {decided ? <Pill tone={live ? "green" : "neutral"}>{account.status}</Pill> : null}
          </div>
          <div style={{ fontSize: 12, color: SOFT, marginTop: 3, ...clip }}>
            {account.applicantEmail ?? "no contact email"} · applied{" "}
            {new Date(account.appliedAt).toLocaleDateString("en", { day: "numeric", month: "short" })}
          </div>

          {account.pitch ? (
            <p style={{ fontSize: 13, color: INK, margin: "9px 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {account.pitch}
            </p>
          ) : null}

          {account.audienceUrl ? (
            <a
              href={account.audienceUrl}
              target="_blank"
              rel="noreferrer nofollow noopener"
              style={{ display: "inline-block", fontSize: 12.5, marginTop: 7, color: TONE.indigo.ink }}
            >
              {account.audienceUrl}
            </a>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0, minWidth: 170 }}>
          <input
            name="note"
            placeholder={decided ? "Reason (optional)" : "Note (optional)"}
            style={{
              border: "1px solid #E7E5DF",
              borderRadius: 8,
              padding: "7px 10px",
              fontFamily: "inherit",
              fontSize: 12.5,
              color: INK,
            }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {!decided ? (
              <>
                <Decide value="approve" tone="green" label="Approve" pending={pending} />
                <Decide value="reject" tone="red" label="Reject" pending={pending} />
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
        </div>
      </div>

      {state.error ? (
        <div style={{ marginTop: 8, fontSize: 12.5, color: TONE.red.ink }} role="alert">
          {state.error}
        </div>
      ) : null}
      {state.notice ? (
        <div style={{ marginTop: 8, fontSize: 12.5, color: TONE.green.ink }} role="status">
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
}: {
  value: string;
  tone: "green" | "red" | "neutral";
  label: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      name="decision"
      value={value}
      disabled={pending}
      style={{
        border: `1px solid ${TONE[tone].border}`,
        background: TONE[tone].tint,
        borderRadius: 8,
        padding: "7px 12px",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 500,
        cursor: pending ? "default" : "pointer",
        color: TONE[tone].ink,
        whiteSpace: "nowrap",
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
