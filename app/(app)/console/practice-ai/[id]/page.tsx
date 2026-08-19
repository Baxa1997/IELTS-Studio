import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { BLUEPRINT_LABEL, BLUEPRINT_TINT } from "@/lib/console/lessons";
import { loadGroups } from "@/lib/console/groups";
import { loadLesson } from "@/lib/lessons/load";
import { createClient } from "@/lib/supabase/server";
import {
  EMBER,
  FAINT,
  INK,
  LESSON_SKY,
  LIFT_CARD,
  LIFT_PANEL,
  PAPER,
  READING,
  SANS,
  SERIF,
  SOFT,
  STAGE_META,
  WASH,
} from "@/lib/lessons/theme";
import { isOpen } from "@/lib/lessons/types";

import { GiveToStudents } from "./give-to-students";
import { PrintableWorksheet } from "./printable";
import { LessonStaffBar } from "./staff-bar";
import { WorksheetButton } from "./worksheet";

export const dynamic = "force-dynamic";

/**
 * A lesson, as the teacher who made it needs to read it.
 *
 * TWO COLUMNS FROM THE FIRST PIXEL. The left is the lesson: what it is, and
 * then the reading. The right is a single dark panel that answers "what does
 * this actually make a student do?" — the theme, the shape of the practice, and
 * the two ways out of the page. It starts level with the title rather than
 * below the band, because that question is the first one a teacher has and it
 * used to be a scroll away.
 *
 * THE ANSWER KEY IS NOT HERE. It used to sit at the bottom behind a toggle and
 * roughly doubled the page; a teacher checking whether a lesson is worth
 * setting reads the QUESTIONS, and the sheet they hand out is a print away
 * (`PrintableWorksheet`, screen-hidden). What is left is one screen of lesson
 * and one panel of facts about it.
 *
 * The sky is painted as a band BEHIND the grid rather than wrapping the first
 * row, so both columns can start at the same y and the right one can hang below
 * the gradient without a seam.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const { id } = await params;

  // IN PARALLEL. These two do not need each other, and awaiting them in series
  // put the whole of one query's latency in front of the other before a byte of
  // the page could render. RLS narrows the groups to the ones this teacher
  // owns, so the picker can only ever offer somewhere they may actually set
  // work.
  const [lesson, { groups }] = await Promise.all([loadLesson(id), loadGroups(profile)]);
  if (!lesson) notFound();

  // WHICH CLASSES CAN ACTUALLY BE TOLD. Setting a lesson posts to the group's
  // Telegram channel, and only a VERIFIED link has one — so a group without it
  // gets the homework in silence. The picker is where a teacher is thinking
  // about reaching a class, and the connect screen is the third section of a
  // drawer behind the group page, so the status belongs here rather than being
  // something to go and discover afterwards.
  const linked = await loadTelegramLinks(groups.map((g) => g.id));
  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    students: g.memberCount,
    telegram: linked.has(g.id),
  }));

  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;
  const total = lesson.content.exercises.length;
  const stageCount = (stage: string) =>
    lesson.content.exercises.filter((e) => e.stage === stage).length;
  const openCount = lesson.content.exercises.filter(isOpen).length;
  const tags = [...new Set(lesson.content.exercises.map((e) => e.tag))];

  return (
    <div className="pa-rise" style={{ background: PAPER, minHeight: "100%", fontFamily: SANS }}>
      <LessonStaffBar
        id={lesson.id}
        title={lesson.title}
        status={lesson.status}
        shareEnabled={lesson.shareEnabled}
        shareToken={lesson.shareToken}
        groups={groupOptions}
      />

      <div style={{ position: "relative" }}>
        {/* A quieter sky than the library's, and only behind the top. This page
            is for reading, and a second full-strength gradient competes with
            the prose. */}
        <div
          aria-hidden
          className="pa-noprint"
          style={{
            position: "absolute",
            insetInline: 0,
            top: 0,
            height: 380,
            background: LESSON_SKY,
            pointerEvents: "none",
          }}
        />

        <div
          className="pa-lesson-grid pa-hero-pad"
          style={{
            position: "relative",
            padding: "46px 28px 96px",
          }}
        >
          {/* ── the lesson ─────────────────────────────────────────────────── */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: tint.ink,
              }}
            >
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: tint.ink }} />
              <span>{BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint}</span>
              {lesson.level ? (
                <>
                  <span style={{ color: "#94a0a6" }}>·</span>
                  <span>{lesson.level}</span>
                </>
              ) : null}
            </div>

            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: "clamp(30px, 3.6vw, 46px)",
                lineHeight: 1.08,
                letterSpacing: "-.025em",
                color: INK,
                margin: "14px 0",
                textWrap: "balance",
              }}
            >
              {lesson.title}
            </h1>
            <p
              style={{
                margin: "0 0 26px",
                fontSize: 17.5,
                lineHeight: 1.6,
                color: READING,
                maxWidth: "62ch",
                textWrap: "pretty",
              }}
            >
              {lesson.content.meta.objective}
            </p>

            <div
              style={{
                borderRadius: 28,
                background: "#fff",
                padding: "30px 32px",
                boxShadow: LIFT_PANEL,
              }}
            >
              <LessonSections sections={lesson.content.sections} language={lesson.language} />
            </div>
          </div>

          {/* ── what it makes a student do ─────────────────────────────────── */}
          <div
            className="pa-lesson-rail pa-noprint"
            style={{ position: "sticky", top: 88, display: "grid", gap: 14 }}
          >
            <div
              style={{
                borderRadius: 24,
                background: INK,
                color: "#f3f1ec",
                padding: "20px 20px 18px",
                boxShadow: "0 20px 44px -28px rgba(20,35,46,.7)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#8fa1aa",
                }}
              >
                Practice
              </div>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 21,
                  lineHeight: 1.25,
                  letterSpacing: "-.015em",
                  margin: "6px 0 0",
                  textWrap: "balance",
                }}
              >
                {/* The theme, which is not always the title — a lesson called
                    "Where it goes wrong with linkers" is still about cohesion.
                    Falls back to the title rather than rendering an empty
                    heading on an older row that never stored one. */}
                {lesson.topic?.trim() || lesson.title}
              </h2>

              {/* Four numbers: how much there is, and whether it reaches
                  production or stops at recognition. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 6,
                  margin: "16px 0 18px",
                }}
              >
                <Metric n={total} k="items" />
                <Metric n={stageCount("controlled")} k="warm up" />
                <Metric n={stageCount("semi_controlled")} k="change" />
                <Metric n={openCount} k="written" />
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {STAGE_META.map((stage) => {
                  const n = stageCount(stage.key);
                  return (
                    <div key={stage.key}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        <span>{stage.label}</span>
                        <span style={{ color: "#9fb0b8", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {n}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          borderRadius: 999,
                          background: "rgba(243,241,236,0.14)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            width: total > 0 ? `${(n / total) * 100}%` : "0%",
                            background: EMBER,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 12, color: "#8fa1aa", marginTop: 5, lineHeight: 1.45 }}>
                        {stage.note}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* THE POINT OF THE PANEL. Handing the lesson out used to take
                  two unrelated-looking controls in the top bar, the second of
                  which only appeared after the first — and both server actions
                  refuse a draft, so a teacher who found the group picker early
                  got nothing from it. One button now does whatever is needed. */}
              <div style={{ marginTop: 18 }}>
                <GiveToStudents
                  lessonId={lesson.id}
                  status={lesson.status}
                  groups={groupOptions}
                  shareEnabled={lesson.shareEnabled}
                  shareToken={lesson.shareToken}
                />
              </div>

              {/* The two things a teacher does for themselves, side by side:
                  neither is the main action, and stacking them full-width gave
                  each the same weight as handing the lesson out. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Link
                  href={`/learn/${lesson.id}`}
                  className="pa-ghost"
                  title="See it exactly as a student will"
                  style={{
                    display: "block",
                    padding: "11px 10px",
                    borderRadius: 999,
                    background: "rgba(243,241,236,0.1)",
                    color: "#dfe6ea",
                    fontSize: 13.5,
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Preview
                </Link>
                <WorksheetButton
                  className="pa-ghost"
                  style={{
                    width: "100%",
                    padding: "11px 10px",
                    borderRadius: 999,
                    border: 0,
                    background: "rgba(243,241,236,0.1)",
                    color: "#dfe6ea",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            {tags.length > 0 ? (
              <div style={{ borderRadius: 22, background: "#fff", padding: "18px 20px", boxShadow: LIFT_CARD }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: FAINT,
                  }}
                >
                  Covers
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: WASH,
                        fontSize: 12.5,
                        color: "#46585f",
                      }}
                    >
                      {t.replaceAll("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {lesson.hasAttempts ? (
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: SOFT, padding: "0 4px" }}>
                Someone has already done this lesson, so its content is frozen — a score has to mean
                the lesson they actually sat. Make a new one to change anything.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <PrintableWorksheet title={lesson.title} exercises={lesson.content.exercises} />
    </div>
  );
}

/**
 * Which of these groups has a verified Telegram channel.
 *
 * Read through the RLS client, so it can only see this centre's links — and the
 * ids going in are already the teacher's own groups. A half-finished handshake
 * does not count: `notifyAssignmentTelegram` requires `verified_at`, so
 * anything less would put a tick beside a class that will still be told
 * nothing.
 */
async function loadTelegramLinks(groupIds: string[]): Promise<Set<string>> {
  if (groupIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase
    .from("telegram_links")
    .select("group_id")
    .in("group_id", groupIds)
    .not("verified_at", "is", null)
    .not("chat_id", "is", null);
  return new Set((data ?? []).map((r) => r.group_id as string));
}

/** One number in the dark panel. Small on purpose — this is a glance, not a
 *  dashboard, and four large tiles would outweigh the lesson beside them. */
function Metric({ n, k }: { n: number; k: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "rgba(243,241,236,0.08)",
        padding: "10px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-.02em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 10.5, color: "#8fa1aa", marginTop: 4 }}>{k}</div>
    </div>
  );
}
