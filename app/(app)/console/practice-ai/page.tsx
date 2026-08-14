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
    <div>
      {/* A centred hero, following the reference the owner supplied — and
          full-bleed, so the gradient reaches the edges of the content area. The
          negative margins cancel `.cn-page`'s 26/28px padding exactly; the
          padding below puts it back inside. */}
      <div
        style={{
          margin: "-26px -28px 0",
          padding: "56px 28px 44px",
          background:
            "linear-gradient(180deg, #DDE7EA 0%, #E9EBE7 42%, #F4F3EF 78%, #F4F3EF 100%)",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "clamp(30px, 5vw, 46px)",
              lineHeight: 1.08,
              letterSpacing: "-.02em",
              color: INK,
              margin: "0 0 14px",
              textWrap: "balance",
            }}
          >
            What does your class need?
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: MUTED,
              margin: "0 auto 30px",
              maxWidth: 560,
            }}
          >
            Say it in a sentence. You get a lesson page — the explanation and the practice —
            ready to set as homework or share as a link.
          </p>

          <Composer />
        </div>
      </div>

      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 700,
          color: INK,
          letterSpacing: "-.01em",
          margin: "38px 0 0",
        }}
      >
        Your lessons
      </h2>

      <div style={{ display: "flex", gap: 4, margin: "14px 0", flexWrap: "wrap" }}>
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
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {rows.map((lesson) => (
            <Card key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One lesson.
 *
 * The thumbnail is a real preview — this lesson's own title and first heading,
 * tinted by blueprint — rather than a stock illustration. A grid of identical
 * decorations tells a teacher nothing; a grid where each card shows what is
 * actually inside it can be scanned.
 */
function Card({ lesson }: { lesson: LessonCard }) {
  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;

  return (
    <Link
      href={`/console/practice-ai/${lesson.id}`}
      className="cn-tile"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      <div style={{ background: tint.bg, padding: 12 }}>
        {/* Browser chrome, from the reference: it says "this is a page", which
            is exactly what a lesson is. */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 9 }}>
          {["#F0655A", "#F5BE4F", "#61C554"].map((c) => (
            <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
          <span
            style={{
              marginLeft: 6,
              fontSize: 10.5,
              color: tint.ink,
              opacity: 0.75,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lesson.topic}
          </span>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,.72)",
            borderRadius: 8,
            padding: "12px 13px",
            minHeight: 92,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {lesson.title}
          </div>
          {lesson.previewHeading ? (
            <div style={{ fontSize: 11, color: tint.ink, marginTop: 7, fontWeight: 600 }}>
              {lesson.previewHeading}
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {[92, 78, 60].map((w) => (
              <span key={w} style={{ height: 4, width: `${w}%`, borderRadius: 2, background: "rgba(22,22,46,.09)" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "13px 15px 15px", display: "flex", flexDirection: "column", gap: 7 }}>
        <div
          style={{
            fontSize: 10.5,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: tint.ink,
            fontWeight: 700,
          }}
        >
          {BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint}
          {lesson.level ? ` · ${lesson.level}` : ""}
        </div>

        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
          {lesson.exerciseCount} exercise{lesson.exerciseCount === 1 ? "" : "s"}
          {lesson.language !== "en" ? ` · explained in ${lesson.language.toUpperCase()}` : ""}
        </div>

        {/* The truth about where this lesson has been. "Not set to anyone" is
            worth saying — a library full of unassigned work is the thing a
            teacher most needs to notice. */}
        <div style={{ fontSize: 12, color: FAINT, marginTop: 2 }}>
          {lesson.groups.length > 0 ? (
            <>
              {lesson.groups.slice(0, 2).join(", ")}
              {lesson.groups.length > 2 ? ` +${lesson.groups.length - 2}` : ""}
              {" · "}
              {lesson.completed}/{lesson.assigned} done
              {lesson.averagePercent != null ? ` · avg ${lesson.averagePercent}%` : ""}
            </>
          ) : (
            "Not set to anyone"
          )}
          {lesson.shareEnabled ? " · link on" : ""}
        </div>
      </div>
    </Link>
  );
}
