import Link from "next/link";

import { LegalFooter } from "@/components/legal-footer";
import type { StudentAssignment } from "@/lib/assignments/student";

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
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";

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
              background: "#EAEAFB",
              border: "1px solid rgba(59,67,181,.16)",
              color: INDIGO,
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO }} />
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
        background: a.done ? "#FBFBFE" : "#fff",
        border: `1px solid ${a.overdue && !a.done ? "#F0D2D2" : LINE}`,
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
          <Chip bg="#E7F7EE" fg="#15803d">
            Done
          </Chip>
        ) : a.overdue ? (
          <Chip bg="#FDECEC" fg="#b91c1c">
            Overdue
          </Chip>
        ) : a.dueAt ? (
          <Chip bg="#FDF3E3" fg="#B9791A">
            Due {dateFmt(a.dueAt)}
          </Chip>
        ) : null}
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
      <span style={{ fontSize: 14, fontWeight: 600, color: INDIGO }}>
        {a.done ? "Open again →" : "Start →"}
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
        gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}
