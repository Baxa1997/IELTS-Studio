import { notFound } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { requireOrgUser } from "@/lib/auth";
import { loadLesson } from "@/lib/lessons/load";
import { INK, READING, SERIF } from "@/lib/lessons/theme";

import { LessonRunner } from "./lesson-runner";

export const dynamic = "force-dynamic";

/**
 * A student doing a lesson.
 *
 * In the STUDIO shell, not the app shell: no sidebar, no account chrome,
 * nothing but the lesson. This is a test — the same reasoning that put the
 * reading and writing runners here.
 *
 * The page itself is a THIN WRAPPER. The runner owns the whole viewport,
 * because it has two states that want different shapes — a centred reading
 * column for the explanation, and an item beside a navigator for the practice —
 * and a page that laid out one of them would be fighting the other. Everything
 * this file does is load the lesson and hand the teaching half over as
 * server-rendered markup, so the model's HTML keeps its sanitiser and never
 * ships a DOM implementation to the browser.
 *
 * Access is RLS, not a role check: `loadLesson` returns null unless this lesson
 * was set to a class the reader belongs to (or they are the staff who made it).
 * That single condition is also the "centre students only" rule for AI marking
 * — a lesson reaches a signed-in learner ONLY through a group assignment, and
 * groups exist only inside centres.
 */
export default async function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOrgUser();

  const { id } = await params;
  const lesson = await loadLesson(id);
  if (!lesson) notFound();

  return (
    <LessonRunner
      lessonId={lesson.id}
      title={lesson.title}
      content={lesson.content}
      explanation={
        <>
          <h2
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(30px, 4vw, 46px)",
              lineHeight: 1.06,
              letterSpacing: "-.025em",
              color: INK,
              margin: "0 0 14px",
              textWrap: "balance",
            }}
          >
            {lesson.title}
          </h2>
          <p
            style={{
              margin: "0 0 30px",
              fontSize: 19,
              lineHeight: 1.6,
              color: READING,
              maxWidth: "58ch",
            }}
          >
            {lesson.content.meta.objective}
          </p>
          <LessonSections sections={lesson.content.sections} language={lesson.language} />
        </>
      }
    />
  );
}
