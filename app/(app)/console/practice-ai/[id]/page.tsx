import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { BLUEPRINT_LABEL, BLUEPRINT_TINT } from "@/lib/console/lessons";
import { loadGroups } from "@/lib/console/groups";
import { loadLesson } from "@/lib/lessons/load";
import {
  EMBER,
  FAINT,
  GOOD_BG,
  INK,
  LESSON_SKY,
  LIFT_CARD,
  LIFT_PANEL,
  NOTE_ALT_BG,
  PAPER,
  READING,
  SANS,
  SERIF,
  SOFT,
  STAGE_META,
  WARN_BG,
  WASH,
} from "@/lib/lessons/theme";
import { isOpen } from "@/lib/lessons/types";

import { LessonStaffBar } from "./staff-bar";
import { PracticeReview } from "./practice-review";

export const dynamic = "force-dynamic";

/**
 * A lesson, as the teacher who made it needs to read it.
 *
 * SCAN FIRST, READ SECOND. A teacher checking a lesson before they set it wants
 * to know what it covers and how much of each before they read a word of it, so
 * the page opens with a band of counts and a rail that says where the practice
 * gets to — and only then the prose. The answer key sits at the bottom behind
 * its own toggle rather than doubling the length of everything above it.
 *
 * The reading column and the rail are a grid rather than a fixed 820px card:
 * this route drops the console's padding, so a page that owns the surface has
 * to lay itself out.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const { id } = await params;
  const lesson = await loadLesson(id);
  if (!lesson) notFound();

  // RLS narrows this to the groups this teacher owns, so the picker can only
  // ever offer somewhere they may actually set work.
  const { groups } = await loadGroups(profile);

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
        groups={groups.map((g) => ({ id: g.id, name: g.name, students: g.memberCount }))}
      />

      {/* A quieter sky than the library's. This page is for reading, and a
          second full-strength gradient competes with the prose. */}
      <div className="pa-hero-pad" style={{ background: LESSON_SKY, padding: "54px 28px 44px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            <span style={{ color: "#94a0a6" }}>·</span>
            <span>
              {total} exercise{total === 1 ? "" : "s"}
            </span>
          </div>

          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(34px, 5vw, 62px)",
              lineHeight: 1.04,
              letterSpacing: "-.025em",
              color: INK,
              margin: "16px 0",
              maxWidth: "24ch",
              textWrap: "balance",
            }}
          >
            {lesson.title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 19,
              lineHeight: 1.6,
              color: READING,
              maxWidth: "64ch",
              textWrap: "pretty",
            }}
          >
            {lesson.content.meta.objective}
          </p>

          {/* The shape of the practice, before you read any of it: how much
              there is, and whether it reaches production or stops at
              recognition. */}
          <div className="pa-metrics" style={{ marginTop: 34 }}>
            <Metric n={total} k={`exercise${total === 1 ? "" : "s"}`} bg="#fff" lift />
            <Metric n={stageCount("controlled")} k="warm up" bg={NOTE_ALT_BG} />
            <Metric n={stageCount("semi_controlled")} k="change it" bg={GOOD_BG} />
            <Metric n={openCount} k="AI-marked" bg={WARN_BG} />
          </div>
        </div>
      </div>

      <div
        className="pa-lesson-grid pa-hero-pad"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 28px 96px" }}
      >
        {/* ── the reading column ───────────────────────────────────────────── */}
        <div>
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

          <PracticeReview exercises={lesson.content.exercises} />
        </div>

        {/* ── the rail ─────────────────────────────────────────────────────── */}
        <div className="pa-lesson-rail" style={{ position: "sticky", top: 92, display: "grid", gap: 18 }}>
          <div
            style={{
              borderRadius: 28,
              background: INK,
              color: "#f3f1ec",
              padding: "26px 26px 24px",
              boxShadow: "0 20px 44px -28px rgba(20,35,46,.7)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 28, margin: 0 }}>Practice</h3>
              <span
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "rgba(243,241,236,0.12)",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                its own page
              </span>
            </div>
            <p style={{ margin: "12px 0 20px", fontSize: 15, lineHeight: 1.6, color: "#a9b8c0" }}>
              Students get one item at a time with a navigator — never this page. Nothing here can be
              answered by accident.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              {STAGE_META.map((stage) => {
                const n = stageCount(stage.key);
                return (
                  <div key={stage.key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 7,
                      }}
                    >
                      <span>{stage.label}</span>
                      <span style={{ color: "#9fb0b8", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {n} item{n === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
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
                    <div style={{ fontSize: 13, color: "#8fa1aa", marginTop: 6 }}>{stage.note}</div>
                  </div>
                );
              })}
            </div>

            <Link
              href={`/learn/${lesson.id}`}
              className="pa-ember"
              style={{
                display: "block",
                width: "100%",
                marginTop: 24,
                padding: 15,
                borderRadius: 999,
                background: EMBER,
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 10px 24px -10px rgba(236,106,69,.8)",
              }}
            >
              Preview as student
            </Link>
          </div>

          {tags.length > 0 ? (
            <div style={{ borderRadius: 26, background: "#fff", padding: "22px 24px", boxShadow: LIFT_CARD }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: FAINT,
                }}
              >
                Covers
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 999,
                      background: WASH,
                      fontSize: 13,
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
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: SOFT, padding: "0 4px" }}>
              Someone has already done this lesson, so its content is frozen — a score has to mean
              the lesson they actually sat. Make a new one to change anything.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ n, k, bg, lift }: { n: number; k: string; bg: string; lift?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 22,
        background: bg,
        padding: "20px 22px",
        boxShadow: lift ? "0 1px 2px rgba(20,35,46,.05), 0 14px 30px -26px rgba(20,35,46,.4)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: "-.03em",
          lineHeight: 1,
          color: INK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: SOFT, marginTop: 6 }}>{k}</div>
    </div>
  );
}
