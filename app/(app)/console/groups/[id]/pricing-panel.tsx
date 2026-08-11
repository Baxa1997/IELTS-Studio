"use client";

import { useActionState, useState } from "react";

import { formatMoney, parseMoney } from "@/lib/finance/money";

import { type ActionState, setGroupPricing } from "../../finance/actions";

/**
 * The two prices of this class, edited in place on the class itself.
 *
 * Deliberately here and not only in the finance console. Pricing a class is
 * something the owner does while looking at the class — the roster is right
 * there, and the question "what does this one pay" is the reason they opened
 * the page. The finance console keeps its own copy of this form for the times
 * they are pricing several classes in a row.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const RED = "#B3261E";
const GREEN = "#16794C";

const field: React.CSSProperties = {
  width: "100%",
  height: 34,
  borderRadius: 8,
  border: "1px solid #E4E2DC",
  background: "#fff",
  padding: "0 10px",
  fontSize: 13.5,
  color: INK,
  outline: "none",
};

export function PricingPanel({
  groupId,
  currency,
  lessonsThisMonth,
  feeMajor,
  rateMajor,
}: {
  groupId: string;
  currency: string;
  /** The class's real lesson count this month, for the per-lesson preview. */
  lessonsThisMonth: number;
  /** Current values as plain numbers in major units, or "" when unpriced. */
  feeMajor: string;
  rateMajor: string;
}) {
  const [state, formAction, pending] = useActionState(setGroupPricing, {} as ActionState);
  const [fee, setFee] = useState(feeMajor);
  const [rate, setRate] = useState(rateMajor);

  const perLesson = (input: string): string | null => {
    const minor = parseMoney(input, currency);
    if (minor == null || minor <= 0 || lessonsThisMonth <= 0) return null;
    return formatMoney(Math.round(minor / lessonsThisMonth), currency);
  };

  const feeMinor = parseMoney(fee, currency);
  const rateMinor = parseMoney(rate, currency);
  const marginMinor = feeMinor != null && rateMinor != null ? feeMinor - rateMinor : null;

  return (
    <form action={formAction} style={{ display: "grid", gap: 12 }}>
      <input type="hidden" name="group_id" value={groupId} />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Student pays ({currency})</span>
          <input
            name="fee"
            inputMode="numeric"
            placeholder="550 000"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            style={field}
          />
          <span style={{ fontSize: 11.5, color: FAINT }}>
            {perLesson(fee) ? `${perLesson(fee)} per lesson` : "per month"}
          </span>
        </label>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Teacher earns ({currency})</span>
          <input
            name="teacher_rate"
            inputMode="numeric"
            placeholder="200 000"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            style={field}
          />
          <span style={{ fontSize: 11.5, color: FAINT }}>
            {perLesson(rate) ? `${perLesson(rate)} per lesson` : "per student, per month"}
          </span>
        </label>
      </div>

      {marginMinor != null ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: marginMinor < 0 ? RED : GREEN,
          }}
        >
          {marginMinor < 0
            ? "The teacher earns more per student than the student pays."
            : `${formatMoney(marginMinor, currency)} per student stays with the center.`}
        </p>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            height: 34,
            padding: "0 16px",
            borderRadius: 8,
            border: "none",
            background: "#4340CB",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Saving…" : "Save pricing"}
        </button>
        {state.ok ? <span style={{ fontSize: 12.5, color: GREEN }}>{state.ok}</span> : null}
        {state.error ? (
          <span style={{ fontSize: 12.5, color: RED }} role="alert">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
