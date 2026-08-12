"use client";

import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Which month you are paying — year included.
 *
 * WHAT THIS REPLACED. A single horizontal strip of the last twelve months,
 * scrolled sideways. It worked in January and stopped working the moment a
 * center wanted last March: the year was never written anywhere, so "March" in
 * a list running back from August was ambiguous, and anything older than twelve
 * months was unreachable without editing the URL.
 *
 * Now the year is its own control and the months are a fixed grid — twelve
 * cells that never move, so picking a month is a position rather than a scroll.
 * A dot marks a month that already has a saved run, which is the one thing you
 * want to know before clicking.
 */

const SANS = "var(--font-sans3), ui-sans-serif, system-ui, sans-serif";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E4E2DC";
const INDIGO = "#4340CB";
const GREEN = "#16794C";
const AMBER = "#9A6B00";

const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthPicker({
  active,
  basePath,
  history,
  /** Today's month, so nothing after it is offered — you cannot pay a future. */
  thisMonth,
}: {
  /** `YYYY-MM-01`. */
  active: string;
  basePath: string;
  history: { periodMonth: string; status: string }[];
  thisMonth: string;
}) {
  const statusOf = new Map(history.map((h) => [h.periodMonth, h.status]));
  const year = Number(active.slice(0, 4));
  const activeMonth = Number(active.slice(5, 7));
  const currentYear = Number(thisMonth.slice(0, 4));
  const currentMonth = Number(thisMonth.slice(5, 7));

  const cell = (m: number) => `${year}-${String(m).padStart(2, "0")}-01`;
  // A run in a year we are not looking at still counts towards its dot, so the
  // year stepper can hint that there is something over there.
  const runsIn = (y: number) => history.filter((h) => h.periodMonth.startsWith(String(y))).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "stretch",
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <Link
            href={`${basePath}?month=${year - 1}-${String(activeMonth).padStart(2, "0")}-01`}
            aria-label={`${year - 1}`}
            style={step}
          >
            <FiChevronLeft size={16} aria-hidden />
          </Link>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 74,
              padding: "0 12px",
              borderLeft: `1px solid ${LINE}`,
              borderRight: `1px solid ${LINE}`,
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              color: INK,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {year}
          </span>
          {/* No stepping into a year that has not begun. */}
          {year < currentYear ? (
            <Link
              href={`${basePath}?month=${year + 1}-${String(activeMonth).padStart(2, "0")}-01`}
              aria-label={`${year + 1}`}
              style={step}
            >
              <FiChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <span style={{ ...step, color: "#CFCCC3", cursor: "default" }} aria-hidden>
              <FiChevronRight size={16} />
            </span>
          )}
        </div>

        <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
          {runsIn(year) > 0
            ? `${runsIn(year)} month${runsIn(year) === 1 ? "" : "s"} run in ${year}`
            : `nothing run in ${year} yet`}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
          gap: 5,
        }}
      >
        {SHORT.map((label, i) => {
          const m = i + 1;
          const value = cell(m);
          const on = value === active;
          // Future months cannot be paid, so they are shown but inert — a gap
          // in the grid would move every other cell and break the muscle memory
          // the fixed grid exists to build.
          const future = year > currentYear || (year === currentYear && m > currentMonth);
          const status = statusOf.get(value);
          const dot = status === "paid" ? GREEN : status === "approved" ? GREEN : AMBER;

          const body = (
            <>
              {label}
              {status ? (
                <span
                  aria-label={status}
                  style={{
                    marginLeft: 6,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    display: "inline-block",
                    background: on ? "rgba(255,255,255,.9)" : dot,
                  }}
                />
              ) : null}
            </>
          );

          const shared: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 9,
            padding: "8px 6px",
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: on ? 600 : 500,
            textDecoration: "none",
            border: `1px solid ${on ? INDIGO : LINE}`,
            background: on ? INDIGO : "#fff",
            color: on ? "#fff" : future ? "#C4C1B8" : MUTED,
          };

          return future ? (
            <span key={value} style={{ ...shared, cursor: "default" }} aria-disabled>
              {body}
            </span>
          ) : (
            <Link key={value} href={`${basePath}?month=${value}`} className="cn-chip" style={shared}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const step: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 10px",
  color: "#4C4A63",
  textDecoration: "none",
};
