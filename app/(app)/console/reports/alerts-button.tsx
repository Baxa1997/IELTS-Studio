"use client";

import { useState } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiChevronDown, FiInbox } from "react-icons/fi";

import type { Finding } from "@/lib/console/report-findings";

/**
 * The report's warnings, collected into one control at the top of the page.
 *
 * WHAT THIS REPLACED. The findings were a stack of cards above the tables. They
 * were the most important thing on the page and they pushed everything else
 * below the fold, so the page opened on three paragraphs of prose and a teacher
 * had to scroll past them every single visit to reach the students. Worse, good
 * news and bad news looked alike at a glance — a full-width card saying
 * "practice is getting done" occupied exactly as much of the screen as one
 * saying a class has stopped handing in.
 *
 * A count you can see from across the room is the honest summary: nothing to do
 * reads as "All clear" and takes one line, and anything wrong is a number in a
 * red badge that stays put whatever else lands on the page.
 *
 * THE BADGE COUNTS WHAT NEEDS DOING, not what is listed. Good findings are in
 * the menu — they are the answer to "is this working?" — but they never inflate
 * the number, because a badge that reads 4 when three of them are compliments
 * teaches people to ignore badges.
 */

const SANS = "var(--font-work), system-ui, sans-serif";
const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E7E5DF";
const INDIGO = "#4340CB";
const GREEN = "#16794C";
const AMBER = "#B8791F";
const RED = "#C2453A";

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** One student who has handed work in that nobody has opened. */
export interface NewByStudent {
  studentId: string;
  name: string;
  groupName: string | null;
  /** Unopened pieces. */
  count: number;
  /** When the latest of them was marked. */
  when: string | null;
  /** Their homework list — step two of the drill-down. */
  href: string;
}

export function ReportAlerts({
  findings,
  /** Who has handed in work nobody has opened, newest first. */
  newByStudent,
  /** Where the overflow line jumps to — the hand-ins table. */
  newWorkHref,
}: {
  findings: Finding[];
  newByStudent: NewByStudent[];
  newWorkHref: string;
}) {
  const [open, setOpen] = useState(false);

  const newWork = newByStudent.reduce((n, s) => n + s.count, 0);
  // People, not pieces. Three essays from one student is one person to look at,
  // and a badge that says 3 sends a teacher looking for three names.
  const needsDoing = findings.filter((f) => f.tone !== "good").length + newByStudent.length;
  const anyBad = findings.some((f) => f.tone === "bad");
  const badge = anyBad ? RED : newWork > 0 ? INDIGO : AMBER;
  const clear = needsDoing === 0;

  // Long lists get a tail rather than a scroll race with the findings below.
  const SHOWN = 6;
  const shown = newByStudent.slice(0, SHOWN);
  const hidden = newByStudent.length - shown.length;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          clear ? "Alerts — nothing needs attention" : `Alerts — ${needsDoing} to look at`
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 36,
          padding: "0 12px",
          borderRadius: 10,
          border: `1px solid ${clear ? LINE : badge}`,
          background: clear ? "#fff" : "#fff",
          color: clear ? MUTED : INK,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {clear ? (
          <FiCheckCircle size={15} color={GREEN} aria-hidden />
        ) : (
          <FiAlertTriangle size={15} color={badge} aria-hidden />
        )}
        {clear ? "All clear" : "Alerts"}
        {clear ? null : (
          <span
            style={{
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: badge,
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              lineHeight: "18px",
              textAlign: "center",
              padding: "0 5px",
            }}
          >
            {needsDoing}
          </span>
        )}
        <FiChevronDown
          size={14}
          aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .12s" }}
        />
      </button>

      {open ? (
        <>
          {/* click-away */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "transparent",
              border: "none",
              zIndex: 70,
            }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "min(400px, calc(100vw - 32px))",
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 14,
              boxShadow: "0 18px 44px rgba(22,22,46,.16)",
              zIndex: 71,
              overflow: "hidden",
              fontFamily: SANS,
              textAlign: "left",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${LINE}`,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                color: FAINT,
              }}
            >
              {clear ? "Nothing needs attention" : `${needsDoing} to look at`}
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {/* WHO, BY NAME. The point of this menu is to answer "did anyone
                  do the homework I set last night" without reading the page
                  behind it — so it names them. Each one opens that student's
                  homework list, and the piece itself is one click further. */}
              {shown.length > 0 ? (
                <div
                  style={{
                    padding: "8px 14px 6px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    color: INDIGO,
                    background: "#F7F7FD",
                  }}
                >
                  <FiInbox size={12} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
                  Handed in — not opened yet
                </div>
              ) : null}

              {shown.map((s) => (
                <Link
                  key={s.studentId}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  style={{ ...itemStyle, borderTop: "none", background: "#F7F7FD" }}
                >
                  <span style={{ ...dotStyle, background: INDIGO, marginTop: 5 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={headlineStyle}>{s.name}</span>
                    <span style={detailStyle}>
                      {s.count} {s.count === 1 ? "piece" : "pieces"} marked
                      {s.groupName ? ` · ${s.groupName}` : ""}
                      {s.when ? ` · ${shortDate(s.when)}` : ""}
                    </span>
                  </span>
                  <span style={actionStyle}>Open →</span>
                </Link>
              ))}

              {hidden > 0 ? (
                <Link
                  href={newWorkHref}
                  onClick={() => setOpen(false)}
                  style={{
                    ...itemStyle,
                    borderTop: "none",
                    background: "#F7F7FD",
                    paddingTop: 6,
                    paddingBottom: 12,
                  }}
                >
                  <span style={{ ...dotStyle, background: "transparent" }} />
                  <span style={{ ...actionStyle, flex: 1, textAlign: "left" }}>
                    and {hidden} more →
                  </span>
                </Link>
              ) : null}

              {findings.map((f, i) => {
                const accent = f.tone === "good" ? GREEN : f.tone === "bad" ? RED : AMBER;
                const body = (
                  <>
                    <span style={{ ...dotStyle, background: accent, marginTop: 5 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={headlineStyle}>{f.headline}</span>
                      <span style={detailStyle}>{f.detail}</span>
                    </span>
                    {f.action ? <span style={actionStyle}>{f.action.label} →</span> : null}
                  </>
                );
                const style: React.CSSProperties = {
                  ...itemStyle,
                  borderTop: i === 0 && newWork === 0 ? "none" : `1px solid ${LINE}`,
                };
                return f.action ? (
                  <Link key={i} href={f.action.href} onClick={() => setOpen(false)} style={style}>
                    {body}
                  </Link>
                ) : (
                  <div key={i} style={style}>
                    {body}
                  </div>
                );
              })}

              {findings.length === 0 && newWork === 0 ? (
                <p style={{ padding: "16px 14px", fontSize: 13, color: FAINT, margin: 0 }}>
                  Nothing to flag. Warnings about attendance, completion and students who have
                  stopped will appear here.
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "12px 14px",
  textDecoration: "none",
};

const dotStyle: React.CSSProperties = {
  flex: "none",
  width: 7,
  height: 7,
  borderRadius: "50%",
};

const headlineStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13.5,
  fontWeight: 600,
  color: INK,
  lineHeight: 1.4,
};

const detailStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  color: MUTED,
  marginTop: 3,
  lineHeight: 1.5,
};

const actionStyle: React.CSSProperties = {
  flex: "none",
  fontSize: 12.5,
  fontWeight: 600,
  color: INDIGO,
  whiteSpace: "nowrap",
  alignSelf: "center",
};
