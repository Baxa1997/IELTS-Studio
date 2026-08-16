"use client";

import { useActionState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import { deleteHoliday, saveHoliday, type ActionState } from "../center-actions";

/**
 * The days the center is shut.
 *
 * Not a nicety. Without it, every public holiday generates lessons nobody
 * taught, registers nobody can mark, and a fee divisor that charges parents for
 * a week the doors were locked — and the center finds out at the end of the
 * month, once, and does not forget it.
 *
 * A RANGE, not a date: nobody closes for one morning of Navruz.
 */

const INK = "#16162E";
const FAINT = "#93919F";
const MUTED = "#6E6C87";

export interface Holiday {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
}

const field: React.CSSProperties = {
  border: "1px solid #DDD9D0",
  borderRadius: 8,
  padding: "7px 10px",
  fontFamily: "inherit",
  fontSize: 12.5,
  color: INK,
  background: "#fff",
};

const pretty = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function span(h: Holiday): string {
  if (h.startsOn === h.endsOn) return pretty(h.startsOn);
  const days = Math.round(
    (Date.parse(`${h.endsOn}T00:00:00Z`) - Date.parse(`${h.startsOn}T00:00:00Z`)) / 86400_000 + 1,
  );
  return `${pretty(h.startsOn)} – ${pretty(h.endsOn)} · ${days} days`;
}

export function Holidays({ holidays }: { holidays: Holiday[] }) {
  const [addState, addAction, adding] = useActionState(saveHoliday, {} as ActionState);
  const [delState, delAction] = useActionState(deleteHoliday, {} as ActionState);
  useActionFeedback(addState, { keepOpen: true });
  useActionFeedback(delState, { keepOpen: true });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = holidays.filter((h) => h.endsOn >= today);
  const past = holidays.filter((h) => h.endsOn < today);

  return (
    <div>
      <form
        action={addAction}
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "0 18px 14px",
        }}
      >
        <input
          name="name"
          required
          maxLength={120}
          placeholder="Navruz"
          aria-label="Holiday name"
          style={{ ...field, flex: 1, minWidth: 130 }}
        />
        <input type="date" name="starts_on" required aria-label="First day" style={field} />
        <input
          type="date"
          name="ends_on"
          aria-label="Last day (leave blank for one day)"
          style={field}
        />
        <button
          type="submit"
          disabled={adding}
          className="cn-btn cn-btn--green"
          style={{
            background: "#16794C",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "8px 14px",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: adding ? "wait" : "pointer",
          }}
        >
          {adding ? "Saving…" : "Add"}
        </button>
      </form>

      {[...upcoming, ...past].map((h) => (
        <div
          key={h.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "11px 18px",
            borderTop: "1px solid #F5F4F0",
            fontFamily: "inherit",
            fontSize: 12.5,
            opacity: h.endsOn < today ? 0.6 : 1,
          }}
        >
          <span style={{ fontWeight: 600, color: INK, minWidth: 110 }}>{h.name}</span>
          <span style={{ color: MUTED, flex: 1 }}>{span(h)}</span>
          <form action={delAction}>
            <input type="hidden" name="id" value={h.id} />
            <button
              type="submit"
              style={{
                background: "transparent",
                border: 0,
                fontFamily: "inherit",
                fontSize: 12,
                color: FAINT,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Remove
            </button>
          </form>
        </div>
      ))}

      {holidays.length === 0 ? (
        <div style={{ padding: "0 18px 18px", fontSize: 12.5, color: FAINT }}>
          None set. Every day is a working day until you add one.
        </div>
      ) : null}
    </div>
  );
}
