import Link from "next/link";

import { LegalFooter } from "@/shared/components/legal-footer";
import type { StudentAssignment } from "@/lib/assignments/student";
import {
  BRAND,
  BRAND_FILL,
  BRAND_SOFT,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_GREEN_BG,
  SLATE_INK as INK,
  SLATE_LINE as LINE,
  SLATE_MUTED as FAINT,
  WARM_GREEN,
  WARM_RED,
  withAlpha,
} from "@/lib/theme/tokens";
import { PRACTICE_GRID_COLUMNS } from "@/lib/practice/grid";

/**
 * What a CENTER student sees in place of a practice hub.
 *
 * They practise what their teacher set them, so this is the same list as
 * /assignments narrowed to one skill — not a library, and with no Generate
 * button, because generating is a teaching decision here (owner, 2026-08-09).
 *
 * It is a page rather than a redirect on purpose: "Writing" in the menu should
 * open Writing and show the writing they owe, not bounce them somewhere else
 * and make them find it.
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

const SKILL_COPY: Record<string, { title: string; blurb: string; empty: string }> = {
  writing: {
    title: "Writing",
    blurb: "The writing your teacher has set you.",
    empty: "No writing set yet. When your teacher assigns an essay it appears here.",
  },
  reading: {
    title: "Reading",
    blurb: "The reading your teacher has set you.",
    empty: "No reading set yet. When your teacher assigns a test it appears here.",
  },
  listening: {
    title: "Listening",
    blurb: "The listening your teacher has set you.",
    empty: "No listening set yet. When your teacher assigns a practice it appears here.",
  },
  speaking: {
    title: "Speaking",
    blurb: "The speaking your teacher has set you.",
    empty: "Speaking isn't set as homework yet — your teacher will tell you when it is.",
  },
};

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function AssignedHub({
  skill,
  assignments,
}: {
  skill: "writing" | "reading" | "listening" | "speaking";
  /** Already filtered to this skill by the caller. */
  assignments: StudentAssignment[];
}) {
  const copy = SKILL_COPY[skill];
  const todo = assignments.filter((a) => !a.done);
  const done = assignments.filter((a) => a.done);

  return (
    <div style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(28px,3.6vw,38px)",
              lineHeight: 1.05,
              letterSpacing: "-.4px",
              margin: 0,
            }}
          >
            {copy.title}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0" }}>
            {copy.blurb}
          </p>
        </div>
        {todo.length > 0 ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: BRAND_SOFT,
              border: `1px solid ${withAlpha(BRAND, 16)}`,
              color: BRAND,
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND_FILL }} />
            {todo.length} to do
          </span>
        ) : null}
      </div>

      {assignments.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            border: `1px dashed ${LINE}`,
            borderRadius: 16,
            padding: "32px 24px",
            textAlign: "center",
            color: FAINT,
            fontSize: 14.5,
            lineHeight: 1.6,
          }}
        >
          {copy.empty}
        </div>
      ) : (
        <>
          {todo.length > 0 ? <SectionLabel>To do</SectionLabel> : null}
          <Grid>
            {todo.map((a) => (
              <AssignmentCard key={a.id} a={a} />
            ))}
          </Grid>

          {done.length > 0 ? (
            <>
              <SectionLabel>Done</SectionLabel>
              <Grid>
                {done.map((a) => (
                  <AssignmentCard key={a.id} a={a} />
                ))}
              </Grid>
            </>
          ) : null}
        </>
      )}

      <LegalFooter note="Original practice in the IELTS format. Not affiliated with or endorsed by IELTS®." />
    </div>
  );
}

function AssignmentCard({ a }: { a: StudentAssignment }) {
  return (
    <Link
      href={a.href}
      className="lp-hover"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 11,
        background: a.done ? BRAND_SOFT : PANEL,
        // UNFINISHED IS THE URGENT STATE, not just overdue. Most homework is set
        // without a due date, so keying the red edge to `overdue` meant a
        // student's outstanding work looked identical to work they had already
        // handed in — the whole page read as a neutral list.
        border: `1px solid ${a.done ? LINE : a.overdue ? "var(--ex-hw-overdue-line)" : "var(--rp-err-line)"}`,
        borderLeft: `4px solid ${a.done ? "var(--ex-hw-done-rule)" : a.overdue ? "var(--ex-hw-overdue)" : "var(--ex-hw-due)"}`,
        borderRadius: 16,
        padding: 16,
        minHeight: 150,
        textDecoration: "none",
        color: INK,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: 12, color: FAINT }}>{a.groupName}</span>
        {a.done ? (
          <Chip bg={SLATE_GREEN_BG} fg={WARM_GREEN}>
            Done
          </Chip>
        ) : a.overdue ? (
          <Chip bg="var(--ex-bad-bg)" fg={WARM_RED}>
            Overdue
          </Chip>
        ) : a.dueAt ? (
          <Chip bg="var(--ex-hw-amber-bg)" fg="var(--ex-hw-amber)">
            Due {dateFmt(a.dueAt)}
          </Chip>
        ) : (
          // No due date is the common case, and it still has to read as
          // "you owe this" rather than as an item on a menu.
          <Chip bg="var(--ex-bad-bg)" fg={WARM_RED}>
            To do
          </Chip>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>{a.title}</h4>
        {a.instructions ? (
          <p
            style={{
              fontSize: 13,
              color: MUTED,
              margin: "6px 0 0",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {a.instructions}
          </p>
        ) : null}
      </div>

      <div style={{ height: 1, background: LINE }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: a.done ? BRAND : "var(--ex-hw-overdue)" }}>
        {a.done ? "Open again →" : "Start now →"}
      </span>
    </Link>
  );
}

function Chip({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "3px 9px",
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: FAINT,
        margin: "26px 0 12px",
      }}
    >
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: PRACTICE_GRID_COLUMNS,
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}
