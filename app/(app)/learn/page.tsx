import Link from "next/link";
import { redirect } from "next/navigation";

import { Composer } from "@/shared/components/lessons/lesson-composer";
import { isHomeworkOnlyStudent, requireOrgUser, roleHome } from "@/lib/auth";
import { BLUEPRINT_LABEL, BLUEPRINT_TINT, loadLessons, type LessonCard } from "@/lib/console/lessons";
import { EMBER, FAINT, HERO_SKY, INK, LIFT_CARD, PAPER, SANS, SERIF, SOFT } from "@/lib/lessons/theme";
import { PANEL } from "@/lib/theme/tokens";

export const dynamic = "force-dynamic";

/**
 * /learn — "Practice English with AI" for a SOLO learner: type what you want
 * to get better at, get a lesson page (explanation + practice), do it.
 *
 * The teacher's Practice AI (/console/practice-ai) with the class taken out.
 * Same composer, same engine build, same runner at /learn/[id]; what is gone
 * is everything about other people — publishing, classes, share links — since
 * the learner is both the author and the only reader.
 *
 * ⚠️ NOT FOR A CENTRE'S STUDENT. They practise what their teacher sets
 * (CLAUDE.md, `isHomeworkOnlyStudent`), so they are sent to their homework —
 * and the engine refuses them a build of their own anyway (`may_make_lessons`
 * in the engine's lessons/router.py), which is the check that counts. Staff
 * have their own page with the class tools on it.
 *
 * WHAT IT COSTS THE LEARNER. A build counts as one practice set against the
 * plan's monthly allowance, like every other generated practice — the engine's
 * generation gate does that, not this page. Written answers are marked by a
 * model on the FIRST hand-in of each lesson; a repeat attempt shows the
 * criteria and a model answer to check against (lib/lessons/marking-scope.ts).
 *
 * Reads through RLS: `lessons_author_write` lets anyone read the rows they
 * created in their own org, which for a personal org is exactly "my lessons".
 */
export default async function LearnHomePage() {
  const { profile } = await requireOrgUser();
  if (isHomeworkOnlyStudent(profile)) redirect("/assignments");
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const lessons = await loadLessons({ profileId: profile.id });

  return (
    <div className="pa-rise" style={{ background: PAPER, minHeight: "100%", fontFamily: SANS }}>
      <div className="pa-hero-pad" style={{ background: HERO_SKY, padding: "58px 28px 26px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 18px",
              borderRadius: 999,
              background: INK,
              color: PAPER,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".02em",
            }}
          >
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: 999, background: EMBER }} />
            Explanation + practice in one page
          </div>
          <h1 style={{ fontWeight: 300, fontSize: "clamp(42px, 7vw, 46px)", lineHeight: 1, color: INK, margin: "20px 0 18px" }}>
            Practice English <span style={{ fontWeight: 700 }}>with AI</span>
          </h1>
          <p style={{ margin: "0 auto", fontSize: 21, lineHeight: 1.45, color: "var(--pa-sky-ink)", maxWidth: "40ch" }}>
            Type what you want to get better at. Get a lesson made for it.
          </p>
        </div>
        <div style={{ maxWidth: 880, margin: "42px auto 0" }}>
          <Composer openIn="/learn" learner />
        </div>
      </div>

      <div className="pa-hero-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 28px 90px" }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-.02em", color: INK, margin: 0 }}>
          Your lessons
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 16, color: SOFT }}>Everything you have made. Open one to do it again.</p>

        {lessons.length === 0 ? (
          <div
            style={{
              marginTop: 30,
              borderRadius: 26,
              background: PANEL,
              padding: "44px 28px",
              textAlign: "center",
              color: SOFT,
              fontSize: 15.5,
              lineHeight: 1.6,
              boxShadow: LIFT_CARD,
            }}
          >
            Nothing yet. Type a topic in the box above — a lesson takes about a minute to write.
          </div>
        ) : (
          <div className="pa-grid" style={{ marginTop: 30 }}>
            {lessons.map((lesson) => (
              <Card key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The console's lesson card without the class: no status pill, no "set to". */
function Card({ lesson }: { lesson: LessonCard }) {
  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;
  const kicker = [BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint, lesson.level].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/learn/${lesson.id}`}
      className="pa-card"
      style={{ display: "block", borderRadius: 26, background: PANEL, overflow: "hidden", textDecoration: "none", color: INK, boxShadow: LIFT_CARD }}
    >
      <div style={{ height: 108, padding: "18px 20px", background: tint.wash }}>
        <span aria-hidden style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em", color: tint.ink }}>
          {tint.code}
        </span>
      </div>
      <div style={{ padding: "20px 22px 22px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: FAINT }}>{kicker}</div>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 25,
            lineHeight: 1.2,
            letterSpacing: "-.01em",
            color: INK,
            margin: "9px 0 16px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lesson.title}
        </h3>
        <div style={{ fontSize: 14, color: SOFT }}>
          {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
        </div>
      </div>
    </Link>
  );
}
