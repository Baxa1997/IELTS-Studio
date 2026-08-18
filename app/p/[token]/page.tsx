import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonSections } from "@/components/lessons/lesson-sections";
import { LessonRunner } from "@/app/(app)/learn/[id]/lesson-runner";
import { loadSharedLesson } from "@/lib/lessons/load-shared";
import { INK, READING, SERIF } from "@/lib/lessons/theme";

export const dynamic = "force-dynamic";

/**
 * A lesson on a shared link.
 *
 * The publish modal has offered "Share a link" since Practice AI shipped, and
 * it copied a `/p/{token}` URL to a route that did not exist — so every teacher
 * who used it sent a student to a 404. This is that route.
 *
 * NO SHELL, NO SIGN-IN, NO ACCOUNT. Whoever opens this may have none, which is
 * the point: a teacher sends a link to a Telegram group and it opens. The
 * runner already had the mode this needs — `canSubmit={false}` marks the closed
 * items in the browser with the same function the server uses, stores nothing,
 * and shows the criteria and model answer on written items instead of calling a
 * model for someone we cannot bill or rate-limit.
 *
 * NOINDEX, and not as a formality. A share token is an unguessable capability;
 * it stops being one the moment a crawler puts it in an index, and from there
 * a centre's material is public and permanently so.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function SharedLessonPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lesson = await loadSharedLesson(token);
  // A wrong token, a revoked link and an archived lesson are all the same 404
  // on purpose: a distinct message for each would confirm which tokens exist.
  if (!lesson) notFound();

  return (
    <LessonRunner
      lessonId={lesson.id}
      title={lesson.title}
      content={lesson.content}
      canSubmit={false}
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
