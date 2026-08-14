import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { BLUEPRINT_LABEL, BLUEPRINT_TINT } from "@/lib/console/lessons";
import { loadGroups } from "@/lib/console/groups";
import { loadLesson } from "@/lib/lessons/load";
import { isOpen } from "@/lib/lessons/types";

import { LessonStaffBar } from "./staff-bar";
import { PracticeReview } from "./practice-review";

export const dynamic = "force-dynamic";

const INK = "#15171C";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#E7E5DF";

const STAGE_SHORT: Record<string, string> = {
  controlled: "warm up",
  semi_controlled: "change it",
  freer: "write it",
};

/**
 * A lesson, as the teacher who made it needs to read it.
 *
 * Two problems this layout solves. It used to sit in a fixed 820px card flush
 * against the left edge with the rest of the window empty, because this route
 * drops the console's padding — a page that owns the surface has to lay itself
 * out. And it presented everything at once: every section, every exercise, every
 * answer, in one column. A teacher checking a lesson before setting it needs to
 * SCAN first and read second, so the page now opens with what it covers and how
 * much of each, and the answer key is behind a toggle rather than doubling the
 * length of the practice.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const { id } = await params;
  const lesson = await loadLesson(id);
  if (!lesson) notFound();

  // RLS narrows this to the classes this teacher owns, so the picker can only
  // ever offer somewhere they may actually set work.
  const { groups } = await loadGroups(profile);

  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;
  const stageCount = (stage: string) =>
    lesson.content.exercises.filter((e) => e.stage === stage).length;
  const openCount = lesson.content.exercises.filter(isOpen).length;
  const tags = [...new Set(lesson.content.exercises.map((e) => e.tag))];

  return (
    <div style={{ background: "#FDFDFD", minHeight: "100%" }}>
      {/* A calm band rather than the hero's gradient: this page is for reading,
          and a second big gradient would compete with the thing being read. */}
      <div
        style={{
          background: "linear-gradient(180deg, #F4F6F6 0%, #FDFDFD 100%)",
          borderBottom: `1px solid ${LINE}`,
          padding: "26px 28px 30px",
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Link
            href="/console/practice-ai"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: MUTED,
              textDecoration: "none",
              marginBottom: 16,
            }}
          >
            ← Practice AI
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            <span
              style={{ width: 7, height: 7, borderRadius: "50%", background: tint.ink, flex: "none" }}
            />
            <span
              style={{
                fontSize: 10.5,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: tint.ink,
                fontWeight: 700,
              }}
            >
              {BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint}
            </span>
            {lesson.level ? <span style={{ fontSize: 12.5, color: FAINT }}>· {lesson.level}</span> : null}
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif4), Georgia, serif",
              fontSize: "clamp(26px, 3.6vw, 36px)",
              fontWeight: 700,
              lineHeight: 1.14,
              letterSpacing: "-.02em",
              color: INK,
              margin: "0 0 10px",
              textWrap: "balance",
            }}
          >
            {lesson.title}
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.5, color: MUTED, margin: 0, maxWidth: "62ch" }}>
            {lesson.content.meta.objective}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 28px 90px" }}>
        <LessonStaffBar
          id={lesson.id}
          status={lesson.status}
          shareEnabled={lesson.shareEnabled}
          shareToken={lesson.shareToken}
          hasAttempts={lesson.hasAttempts}
          groups={groups.map((g) => ({ id: g.id, name: g.name, students: g.memberCount }))}
        />

        {/* Scan before you read: what this lesson actually drills, and whether
            the practice reaches production or stops at recognition. */}
        <div
          style={{
            display: "flex",
            gap: 26,
            flexWrap: "wrap",
            padding: "16px 0 18px",
            borderBottom: `1px solid ${LINE}`,
            marginTop: 18,
          }}
        >
          <Stat value={String(lesson.exerciseCount)} label="exercises" />
          {(["controlled", "semi_controlled", "freer"] as const).map((s) => (
            <Stat key={s} value={String(stageCount(s))} label={STAGE_SHORT[s]} />
          ))}
          {openCount > 0 ? <Stat value={String(openCount)} label="written, AI-marked" /> : null}
        </div>

        {tags.length > 0 ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "14px 0 6px" }}>
            <span style={{ fontSize: 12.5, color: FAINT, marginRight: 2 }}>Covers</span>
            {tags.map((t) => (
              <span
                key={t}
                style={{
                  background: "#F4F2ED",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  color: MUTED,
                }}
              >
                {t.replaceAll("-", " ")}
              </span>
            ))}
          </div>
        ) : null}

        <LessonSections sections={lesson.content.sections} language={lesson.language} />

        <PracticeReview exercises={lesson.content.exercises} />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: INK, letterSpacing: "-.01em" }}>
        {value}
      </span>
      <span style={{ fontSize: 12.5, color: FAINT }}>{label}</span>
    </span>
  );
}
