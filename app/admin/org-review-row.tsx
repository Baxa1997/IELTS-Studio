"use client";

import { useActionState } from "react";

import { Glyph, INK, Pill, SOFT, TONE, clip } from "@/components/admin/ui";

import { reviewOrganization, type ReviewState } from "./actions";

const initialState: ReviewState = {};

/**
 * One pending center application, with the decision attached.
 *
 * Approve is a green affirmative and Reject is a quiet icon, deliberately
 * asymmetric: approving is the ordinary outcome and rejecting is the one that
 * should take a beat. Both are plain submit buttons on one form, so the row
 * works before any JavaScript arrives.
 */
export function OrgReviewRow({
  orgId,
  name,
  email,
  applied,
}: {
  orgId: string;
  name: string;
  email: string | null;
  applied: string;
}) {
  const [state, formAction, pending] = useActionState(reviewOrganization, initialState);

  return (
    <form
      action={formAction}
      className="ad-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid #F5F4F0",
        flexWrap: "wrap",
      }}
    >
      <input type="hidden" name="org_id" value={orgId} />

      <Glyph tone="indigo" size={34}>
        {name.slice(0, 2).toUpperCase()}
      </Glyph>

      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{name} applied</span>
          <Pill tone="indigo">center</Pill>
        </div>
        <div style={{ fontSize: 12, color: SOFT, marginTop: 3, ...clip }}>
          {email ?? "no contact email"} · applied {applied}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            border: `1px solid ${TONE.green.border}`,
            background: "#EFF7F2",
            borderRadius: 8,
            padding: "7px 12px",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 500,
            cursor: pending ? "default" : "pointer",
            color: TONE.green.ink,
            whiteSpace: "nowrap",
          }}
        >
          {pending ? "Working…" : "Approve"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          title="Reject this application"
          className="ad-act ad-act--danger"
          style={{ color: TONE.red.ink, fontFamily: "inherit", fontSize: 15 }}
        >
          ✕
        </button>
      </div>

      {state.error ? (
        <div style={{ flexBasis: "100%", fontSize: 12.5, color: TONE.red.ink }} role="alert">
          {state.error}
        </div>
      ) : null}
      {state.notice ? (
        <div style={{ flexBasis: "100%", fontSize: 12.5, color: TONE.green.ink }} role="status">
          {state.notice}
        </div>
      ) : null}
    </form>
  );
}
