"use client";

import Link from "next/link";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * The day being marked.
 *
 * Same grouped-toolbar shape as the timetable's week picker, on purpose: they
 * are the same control doing the same job at a different grain, and a center
 * that learns one should not have to learn the other.
 */

const SANS = "var(--font-sans3), ui-sans-serif, system-ui, sans-serif";
const HAIRLINE = "#E4E2DC";
const INK = "#16162E";
const INDIGO = "#4340CB";
const GREEN = "#16794C";

const shift = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const pretty = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export function DateStrip({
  date,
  today,
  groupId,
}: {
  date: string;
  today: string;
  /** Set on a group register, so stepping a day stays on that group. */
  groupId?: string;
}) {
  const base = groupId ? `/console/attendance/${groupId}` : "/console/attendance";
  const href = (d: string) => (d === today && !groupId ? base : `${base}?date=${d}`);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 10,
          background: "#fff",
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(22,22,46,.04)",
        }}
      >
        <Link href={href(shift(date, -1))} aria-label="Previous day" style={step}>
          <FiChevronLeft size={16} aria-hidden />
        </Link>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
            borderLeft: `1px solid ${HAIRLINE}`,
            borderRight: `1px solid ${HAIRLINE}`,
            fontFamily: SANS,
            fontSize: 13.5,
            fontWeight: 600,
            color: INK,
            minWidth: 130,
            justifyContent: "center",
          }}
        >
          <FiCalendar size={14} color={INDIGO} aria-hidden />
          {pretty(date)}
        </span>
        <Link href={href(shift(date, 1))} aria-label="Next day" style={step}>
          <FiChevronRight size={16} aria-hidden />
        </Link>
      </div>

      {date === today ? (
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            color: GREEN,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            aria-hidden
            style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }}
          />
          Today
        </span>
      ) : (
        <Link href={href(today)} style={chip}>
          Back to today
        </Link>
      )}

      <form
        method="get"
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          marginLeft: "auto",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 10,
          background: "#fff",
          overflow: "hidden",
        }}
      >
        <input
          type="date"
          name="date"
          defaultValue={date}
          aria-label="Jump to a date"
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            padding: "7px 10px",
            border: 0,
            outline: "none",
            background: "transparent",
            color: INK,
          }}
        />
        <button
          type="submit"
          style={{
            border: 0,
            borderLeft: `1px solid ${HAIRLINE}`,
            background: "#FAF9F6",
            padding: "0 13px",
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 600,
            color: INDIGO,
            cursor: "pointer",
          }}
        >
          Go
        </button>
      </form>
    </div>
  );
}

const step: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 11px",
  color: "#4C4A63",
  textDecoration: "none",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 9,
  padding: "7px 12px",
  fontFamily: SANS,
  fontSize: 12.5,
  textDecoration: "none",
  border: `1px solid ${HAIRLINE}`,
  background: "#fff",
  color: "#4C4A63",
};
