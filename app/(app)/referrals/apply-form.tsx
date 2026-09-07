"use client";

import { useActionState } from "react";

import { BRAND, BRAND_LINE, BRAND_SOFT, FIELD_LINE, INK, LINE, MUTED, SANS, WHITE } from "@/lib/theme/tokens";

import { submitApplication, type ApplyState } from "./actions";

const initial: ApplyState = {};

/**
 * The application.
 *
 * TWO FIELDS, AND THEY ARE THE WHOLE POINT. A brand-new free account has no
 * history for a reviewer to judge, so if the form does not carry the case there
 * is nothing to review and the queue becomes a rubber stamp. The pitch asks
 * where they will actually share it; the link is what makes the answer checkable.
 *
 * The link is optional because plenty of real referrers share in a group chat
 * that has no public URL — requiring one would reject exactly the people the
 * programme is for.
 */
export function ApplyForm({ percent }: { percent: number }) {
  const [state, action, pending] = useActionState(submitApplication, initial);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: INK }}>
          Where would you share your link?
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED }}>
          A sentence or two. Who follows you, and why would they be preparing for IELTS?
        </span>
        <textarea
          name="pitch"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="I run a Telegram channel for students preparing for the exam in Tashkent — about 2,000 of them…"
          style={{
            width: "100%",
            border: `1px solid ${FIELD_LINE}`,
            borderRadius: 11,
            padding: "11px 13px",
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: INK,
            background: WHITE,
            resize: "vertical",
          }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: INK }}>
          A link to that audience <span style={{ fontWeight: 500, color: MUTED }}>— optional</span>
        </span>
        <input
          type="url"
          name="audience_url"
          placeholder="https://t.me/your-channel"
          style={{
            width: "100%",
            border: `1px solid ${FIELD_LINE}`,
            borderRadius: 11,
            padding: "11px 13px",
            fontFamily: SANS,
            fontSize: 14.5,
            color: INK,
            background: WHITE,
          }}
        />
      </label>

      <div
        style={{
          background: BRAND_SOFT,
          border: `1px solid ${BRAND_LINE}`,
          borderRadius: 12,
          padding: "13px 15px",
          fontFamily: SANS,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: INK,
        }}
      >
        You earn <strong>{percent}%</strong> of the <strong>first payment</strong> each person you
        refer makes — once per person, not on their later months. Someone who signs up and stays on
        the free plan earns nothing; the commission comes from an actual payment.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            border: 0,
            background: BRAND,
            color: WHITE,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 15,
            padding: "12px 26px",
            borderRadius: 999,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Sending…" : "Apply"}
        </button>
        <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>
          Reviewed by a person, not automatically.
        </span>
      </div>

      {state.error ? (
        <p role="alert" style={{ margin: 0, fontFamily: SANS, fontSize: 13.5, color: "#B23B31" }}>
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p role="status" style={{ margin: 0, fontFamily: SANS, fontSize: 13.5, color: "#1C7A4F" }}>
          {state.notice}
        </p>
      ) : null}
      <div style={{ height: 1, background: LINE }} aria-hidden />
    </form>
  );
}
