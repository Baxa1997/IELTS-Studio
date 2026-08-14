import Link from "next/link";
import { redirect } from "next/navigation";

import { SERIF } from "@/components/console/crm-ui";
import { requireOrgUser, roleHome } from "@/lib/auth";
import {
  BLUEPRINT_LABEL,
  BLUEPRINT_TINT,
  loadLessons,
  type LessonCard,
  type LessonStatus,
} from "@/lib/console/lessons";

import { Composer } from "./composer";

export const dynamic = "force-dynamic";

const INK = "#16162E";
const MUTED = "#6E6C87";
const FAINT = "#93919F";
const LINE = "#E7E5DF";
const INDIGO = "#4340CB";

const TABS: { key: LessonStatus; label: string; blurb: string }[] = [
  { key: "draft", label: "Drafts", blurb: "Made, not published. Only you can see these." },
  { key: "published", label: "Published", blurb: "Ready to set to a class or share." },
  { key: "archived", label: "Archived", blurb: "Retired, but kept — attempts point at them." },
];

/**
 * Practice AI: type what you need, get a lesson page.
 *
 * Teacher-only. A lesson is something you MAKE, and an administrator runs the
 * front desk rather than the teaching — the RLS write policy says the same, so
 * this redirect is the readable half of a rule the database also enforces.
 */
export default async function PracticeAiPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const sp = await searchParams;
  const tab = (TABS.some((t) => t.key === sp.tab) ? sp.tab : "draft") as LessonStatus;

  const all = await loadLessons({ profileId: profile.id });
  const rows = all.filter((l) => l.status === tab);
  const count = (key: LessonStatus) => all.filter((l) => l.status === key).length;

  return (
    // The page owns the whole surface — the console chrome drops its bar and its
    // padding for this route. #FDFDFD is where the hero gradient ENDS, so the
    // library below continues the same sheet of paper instead of sitting on the
    // console's cream and reading as a separate panel bolted underneath.
    <div style={{ background: "#FDFDFD", minHeight: "100%" }}>
      {/* A centred hero, following the reference the owner supplied — and
          full-bleed, so the gradient reaches the edges of the content area. The
          negative margins cancel `.cn-page`'s 26/28px padding exactly; the
          padding below puts it back inside. */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "76px 28px 68px",
          /* Inline rather than a stylesheet class, deliberately.
             This is a static value with no pseudo-selector, so a class buys
             nothing — and it costs something real: a class lives in globals.css,
             which a dev server or a browser can serve a stale copy of, and then
             the page renders with the inline styles applied and the gradient
             missing. Which is exactly what happened. Only :hover and
             :focus-within states are left in CSS, because those genuinely
             cannot be expressed inline.

             Stops copied verbatim from lucid-ai's `.lucid-hero-bg`. It ends at
             #FDFDFD rather than the console cream so the library below joins
             without a seam. */
          background:
            "linear-gradient(180deg, #A4CFD6 0%, #A4CFD6 8%, #A8D2D8 18%, #AED5DB 28%, #B6D8DD 38%, #C2DDE0 48%, #D2E2E2 58%, #E2E9E6 66%, #EFEEEA 72%, #F7F6F2 77%, #FBFBF8 81%, #FDFDFD 84%, #FDFDFD 100%)",
        }}
      >
        {/* Radial highlights + grain, masked so they fade before the gradient
            reaches paper — without the mask there is a visible band at the join. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            maskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 75%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-10%",
              background:
                "radial-gradient(60% 40% at 50% 14%, rgba(255,255,255,.20), transparent 65%), radial-gradient(55% 45% at 86% 18%, rgba(120,170,180,.18), transparent 70%), radial-gradient(55% 45% at 14% 18%, rgba(100,160,175,.16), transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.16,
              mixBlendMode: "multiply",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.09  0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        <div style={{ position: "relative", maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontWeight: 400,
              fontSize: "clamp(34px, 6vw, 60px)",
              lineHeight: 1.02,
              letterSpacing: "-.04em",
              color: "#15171C",
              margin: "0 0 22px",
              textWrap: "balance",
            }}
          >
            Where lessons come to life
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              letterSpacing: "-.01em",
              color: "rgba(42,45,52,.85)",
              margin: "0 auto",
              maxWidth: "68ch",
            }}
          >
            Say what your class needs and get a lesson page — the explanation and the practice.
            <span style={{ display: "block", marginTop: 4, fontWeight: 500, color: "#15171C" }}>
              Ready to set as homework, or share as a link.
            </span>
          </p>

          <div style={{ marginTop: 44 }}>
            <Composer />
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 32px 96px" }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 24,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-.015em",
          margin: "0 0 2px",
        }}
      >
        Your lessons
      </h2>
      <p style={{ fontSize: 14, color: MUTED, margin: "0 0 18px" }}>
        Everything you&apos;ve made, and where it has been.
      </p>

      <div style={{ display: "flex", gap: 4, margin: "0 0 18px", flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/console/practice-ai?tab=${t.key}`}
              style={{
                padding: "8px 15px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
                color: on ? INDIGO : MUTED,
                background: on ? "#EEEDF8" : "transparent",
                border: `1px solid ${on ? "#C7C5F0" : "transparent"}`,
              }}
            >
              {t.label}
              <span style={{ marginLeft: 7, fontSize: 12, color: on ? INDIGO : FAINT, opacity: 0.8 }}>
                {count(t.key)}
              </span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 14,
            padding: "34px 24px",
            textAlign: "center",
            color: MUTED,
            fontSize: 14,
          }}
        >
          {tab === "draft"
            ? "Nothing yet. Type what your class needs in the box above — a lesson takes about a minute to write."
            : tab === "published"
              ? "Nothing published yet. Open a draft and publish it once you're happy with it."
              : "Nothing archived."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {rows.map((lesson) => (
            <Card key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

/**
 * One lesson.
 *
 * Each KIND of lesson looks different — its own wash, accent and mark on the
 * header band. A library where every card is identical is a library you have to
 * read word by word; giving grammar, vocabulary, skills and exam technique
 * distinct faces means the grid can be scanned instead.
 *
 * The band also carries the thing a teacher most wants to know at a glance and
 * would otherwise have to open the lesson for: whether anyone has been set it.
 */
function Card({ lesson }: { lesson: LessonCard }) {
  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;
  const used = lesson.groups.length > 0;

  return (
    <Link
      href={`/console/practice-ai/${lesson.id}`}
      className="pa-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        boxShadow: "0 1px 2px rgba(21,23,28,.04)",
      }}
    >
      <div
        style={{
          background: tint.wash,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "#fff",
            color: tint.ink,
            display: "grid",
            placeItems: "center",
            fontSize: 15,
            fontWeight: 700,
            flex: "none",
            boxShadow: "0 1px 2px rgba(21,23,28,.08)",
          }}
        >
          {tint.mark}
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 10.5,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: tint.ink,
              fontWeight: 700,
            }}
          >
            {BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint}
          </span>
          <span style={{ display: "block", fontSize: 12, color: MUTED, marginTop: 1 }}>
            {lesson.level ? `${lesson.level} · ` : ""}
            {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
            {lesson.language !== "en" ? ` · +${lesson.language.toUpperCase()}` : ""}
          </span>
        </span>
      </div>

      <div style={{ padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div
          style={{
            fontSize: 16.5,
            fontWeight: 650,
            color: "#15171C",
            lineHeight: 1.32,
            letterSpacing: "-.01em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lesson.title}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: used ? "#16794C" : "#D5D2CA",
              flex: "none",
            }}
          />
          <span style={{ color: used ? "#16794C" : FAINT, fontWeight: used ? 600 : 400 }}>
            {used
              ? `${lesson.completed}/${lesson.assigned} done${lesson.averagePercent != null ? ` · ${lesson.averagePercent}%` : ""}`
              : "Not set to anyone"}
          </span>
          {lesson.shareEnabled ? (
            <span style={{ marginLeft: "auto", color: "#A9721F", fontSize: 11.5 }}>link on</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
