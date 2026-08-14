import Link from "next/link";
import { notFound } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { requireOrgUser } from "@/lib/auth";
import { loadLesson } from "@/lib/lessons/load";

import { LessonRunner } from "./lesson-runner";

export const dynamic = "force-dynamic";

/**
 * A student doing a lesson.
 *
 * In the STUDIO shell, not the app shell: no sidebar, no account chrome,
 * nothing but the page. This is a test — the same reasoning that put the
 * reading and writing runners here. One centred column, because a lesson is
 * read like a page and answered like a paper, and neither wants a rail beside
 * it competing for attention.
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
    <div style={{ background: "#FDFDFD", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <header style={{ marginBottom: 30 }}>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#8B909B",
              marginBottom: 10,
            }}
          >
            {lesson.level ? `${lesson.level} · ` : ""}
            {lesson.exerciseCount} question{lesson.exerciseCount === 1 ? "" : "s"}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif4), Georgia, serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-.02em",
              color: "#15171C",
              margin: "0 0 10px",
              textWrap: "balance",
            }}
          >
            {lesson.title}
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: "#2A2D34", margin: 0 }}>
            {lesson.content.meta.objective}
          </p>
        </header>

        <LessonSections sections={lesson.content.sections} language={lesson.language} />

        <hr style={{ border: 0, borderTop: "1px solid #E7E5DF", margin: "8px 0 26px" }} />

        <h2
          style={{
            fontFamily: "var(--font-serif4), Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#15171C",
            margin: "0 0 6px",
          }}
        >
          Your turn
        </h2>
        <p style={{ fontSize: 14, color: "#5C616C", margin: "0 0 26px" }}>
          Answer everything you can, then hand it in. You&apos;ll see what you got right — and why
          — straight away.
        </p>

        <LessonRunner lessonId={lesson.id} content={lesson.content} />

        <footer style={{ marginTop: 50, fontSize: 12.5, color: "#8B909B" }}>
          <Link href="/assignments" style={{ color: "#5C616C" }}>
            ← Back to your assignments
          </Link>
        </footer>
      </div>
    </div>
  );
}
