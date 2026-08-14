import { notFound, redirect } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { PageHead } from "@/components/console/crm-ui";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { BLUEPRINT_LABEL } from "@/lib/console/lessons";
import { loadLesson } from "@/lib/lessons/load";
import { isOpen, type Exercise } from "@/lib/lessons/types";

import { LessonStaffBar } from "./staff-bar";

export const dynamic = "force-dynamic";

const INK = "#15171C";
const BODY = "#2A2D34";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#E7E5DF";

const STAGE_LABEL: Record<string, string> = {
  controlled: "Recognise it",
  semi_controlled: "Work with it",
  freer: "Use it yourself",
};

const STAGE_NOTE: Record<string, string> = {
  controlled: "Check they can spot and produce the form with support.",
  semi_controlled: "Transform and correct — where understanding shows.",
  freer: "Produce their own language. The only proof they can use it.",
};

/**
 * A lesson, exactly as a learner will meet it — plus the bar of things only a
 * teacher can do.
 *
 * Deliberately not a "preview mode". The one honest way to know what you are
 * about to set thirty people is to read the page they will read, so this shows
 * the real thing and adds to it rather than rebuilding a staff copy that could
 * drift from what students see.
 *
 * The answer key IS shown here, which is the one difference from the student
 * view — checking the marking is most of what reviewing a generated lesson
 * means.
 */
export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const { id } = await params;
  const lesson = await loadLesson(id);
  if (!lesson) notFound();

  const byStage = (stage: string) => lesson.content.exercises.filter((e) => e.stage === stage);

  return (
    <div>
      <PageHead
        back={{ href: "/console/practice-ai", label: "Practice AI" }}
        eyebrow={BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint}
        title={lesson.title}
        subtitle={
          <>
            {lesson.content.meta.objective}
            <span style={{ display: "block", marginTop: 4, fontSize: 12.5, color: FAINT }}>
              {lesson.level ? `${lesson.level} · ` : ""}
              {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
              {lesson.language !== "en" ? ` · explained in ${lesson.language.toUpperCase()}` : ""}
            </span>
          </>
        }
      />

      <LessonStaffBar
        id={lesson.id}
        status={lesson.status}
        shareEnabled={lesson.shareEnabled}
        shareToken={lesson.shareToken}
        hasAttempts={lesson.hasAttempts}
      />

      <div
        style={{
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 14,
          padding: "28px 30px",
          marginTop: 16,
          maxWidth: 820,
        }}
      >
        <LessonSections sections={lesson.content.sections} />

        <hr style={{ border: 0, borderTop: `1px solid ${LINE}`, margin: "10px 0 26px" }} />

        <h2
          style={{
            fontFamily: "var(--font-serif4), Georgia, serif",
            fontSize: 21,
            fontWeight: 700,
            color: INK,
            margin: "0 0 4px",
          }}
        >
          Practice
        </h2>
        <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 22px" }}>
          Answers are shown here because you are the teacher. Students see them only after they
          submit.
        </p>

        {(["controlled", "semi_controlled", "freer"] as const).map((stage) => {
          const items = byStage(stage);
          if (items.length === 0) return null;
          return (
            <section key={stage} style={{ marginBottom: 30 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 650, color: INK }}>
                  {STAGE_LABEL[stage]}
                </div>
                <div style={{ fontSize: 12.5, color: FAINT }}>{STAGE_NOTE[stage]}</div>
              </div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.map((exercise, i) => (
                  <ExerciseRow key={exercise.id} exercise={exercise} n={i + 1} />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** One exercise with its key — the review view, not the answering view. */
function ExerciseRow({ exercise, n }: { exercise: Exercise; n: number }) {
  return (
    <li
      style={{
        borderTop: `1px solid #F2F0EB`,
        padding: "14px 0",
        display: "flex",
        gap: 12,
      }}
    >
      <span
        style={{
          flex: "none",
          width: 22,
          fontSize: 12.5,
          color: FAINT,
          fontVariantNumeric: "tabular-nums",
          paddingTop: 2,
        }}
      >
        {n}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, color: BODY, lineHeight: 1.55 }}>
          {exercise.prompt}
        </span>

        {!isOpen(exercise) && exercise.options ? (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {exercise.options.map((opt, i) => {
              const correct = exercise.answers.includes(String(i));
              return (
                <span
                  key={opt}
                  style={{
                    border: `1px solid ${correct ? "#B6D9C4" : LINE}`,
                    background: correct ? "#EAF4EE" : "#FAFAF8",
                    color: correct ? "#16794C" : MUTED,
                    borderRadius: 999,
                    padding: "4px 11px",
                    fontSize: 13,
                    fontWeight: correct ? 600 : 400,
                  }}
                >
                  {opt}
                </span>
              );
            })}
          </span>
        ) : null}

        {!isOpen(exercise) && !exercise.options ? (
          <span style={{ display: "block", marginTop: 7, fontSize: 13.5, color: "#16794C" }}>
            <strong style={{ fontWeight: 600 }}>Answer:</strong> {exercise.answers.join("  /  ")}
          </span>
        ) : null}

        {/* An open item has no answer key — it has the checklist the marker will
            use. Showing it is the only way a teacher can tell whether the
            marking will be fair before setting it. */}
        {isOpen(exercise) ? (
          <span style={{ display: "block", marginTop: 8 }}>
            <span style={{ fontSize: 12.5, color: FAINT }}>Marked against:</span>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13.5, color: BODY }}>
              {exercise.criteria.map((c) => (
                <li key={c} style={{ marginBottom: 2 }}>
                  {c}
                </li>
              ))}
            </ul>
            <span style={{ display: "block", marginTop: 6, fontSize: 13.5, color: "#16794C" }}>
              <strong style={{ fontWeight: 600 }}>Model answer:</strong> {exercise.model_answer}
            </span>
          </span>
        ) : null}

        {exercise.why ? (
          <span style={{ display: "block", marginTop: 6, fontSize: 12.5, color: MUTED }}>
            {exercise.why}
          </span>
        ) : null}

        <span
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: 11,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: FAINT,
          }}
        >
          {exercise.tag.replaceAll("-", " ")}
        </span>
      </span>
    </li>
  );
}
