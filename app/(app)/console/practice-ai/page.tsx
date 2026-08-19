import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import {
  BLUEPRINT_LABEL,
  BLUEPRINT_TINT,
  loadLessons,
  type LessonCard,
  type LessonStatus,
} from "@/lib/console/lessons";
import {
  FAINT,
  HERO_SKY,
  INK,
  LIFT_CARD,
  PAPER,
  SANS,
  SERIF,
  SOFT,
  TROUGH,
  WASH,
} from "@/lib/lessons/theme";

import { Composer } from "./composer";

export const dynamic = "force-dynamic";

const TABS: { key: LessonStatus; label: string; empty: string }[] = [
  {
    key: "draft",
    label: "Drafts",
    empty:
      "Nothing yet. Type what your group needs in the box above — a lesson takes about a minute to write.",
  },
  {
    key: "published",
    label: "Published",
    empty: "Nothing published yet. Open a draft and publish it once you're happy with it.",
  },
  { key: "archived", label: "Archived", empty: "Nothing archived." },
];

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
    <div className="pa-rise" style={{ background: PAPER, minHeight: "100%", fontFamily: SANS }}>
      {/* The sky. It ends on PAPER exactly, so the library below continues the
          same sheet instead of reading as a panel bolted underneath. */}
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
            <span
              aria-hidden
              style={{ width: 7, height: 7, borderRadius: 999, background: "#ec6a45" }}
            />
            Explanation + practice in one page
          </div>

          <h1
            style={{
              fontWeight: 300,
              fontSize: "clamp(42px, 7vw, 46px)",
              lineHeight: 1,
              color: INK,
              margin: "20px 0 18px",
            }}
          >
            Where lessons <span style={{ fontWeight: 700 }}>come to life</span>
          </h1>
          <p
            style={{
              margin: "0 auto",
              fontSize: 21,
              lineHeight: 1.45,
              color: "#33505c",
              maxWidth: "40ch",
            }}
          >
            Type what your group needs. Assign it in one click.
          </p>
        </div>

        <div style={{ maxWidth: 880, margin: "42px auto 0" }}>
          <Composer />
        </div>
      </div>

      <div
        className="pa-hero-pad"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 28px 90px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: "clamp(28px, 4vw, 40px)",
                letterSpacing: "-.02em",
                color: INK,
                margin: 0,
              }}
            >
              Your lessons
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 16, color: SOFT }}>
              Everything you&apos;ve made, and where it has been.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 5,
              borderRadius: 999,
              background: TROUGH,
            }}
          >
            {TABS.map((t) => {
              const on = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/console/practice-ai?tab=${t.key}`}
                  aria-current={on ? "page" : undefined}
                  className="pa-tap"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    color: on ? INK : SOFT,
                    background: on ? "#fff" : "transparent",
                    boxShadow: on ? "0 1px 2px rgba(20,35,46,.1)" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}{" "}
                  <span style={{ opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>
                    {count(t.key)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <div
            style={{
              marginTop: 30,
              borderRadius: 26,
              background: "#fff",
              padding: "44px 28px",
              textAlign: "center",
              color: SOFT,
              fontSize: 15.5,
              lineHeight: 1.6,
              boxShadow: LIFT_CARD,
            }}
          >
            {TABS.find((t) => t.key === tab)?.empty}
          </div>
        ) : (
          <div className="pa-grid" style={{ marginTop: 30 }}>
            {rows.map((lesson) => (
              <Card key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ lesson }: { lesson: LessonCard }) {
  const tint = BLUEPRINT_TINT[lesson.blueprint] ?? BLUEPRINT_TINT.grammar;
  const published = lesson.status === "published";

  const kicker = [BLUEPRINT_LABEL[lesson.blueprint] ?? lesson.blueprint, lesson.level]
    .filter(Boolean)
    .join(" · ");

  // One line, and it answers "is this doing anything?" — how big it is, and
  // where it has been. A lesson set to nobody says so rather than staying quiet.
  const meta = [
    `${lesson.exerciseCount} exercise${lesson.exerciseCount === 1 ? "" : "s"}`,
    lesson.groups.length > 0
      ? `${lesson.completed}/${lesson.assigned} done${lesson.averagePercent != null ? ` · ${lesson.averagePercent}%` : ""}`
      : lesson.shareEnabled
        ? "link on"
        : "not set to anyone",
  ].join(" · ");

  return (
    <Link
      href={`/console/practice-ai/${lesson.id}`}
      className="pa-card"
      style={{
        display: "block",
        borderRadius: 26,
        background: "#fff",
        overflow: "hidden",
        textDecoration: "none",
        color: INK,
        boxShadow: LIFT_CARD,
      }}
    >
      <div
        style={{
          height: 108,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "18px 20px",
          background: tint.wash,
        }}
      >
        <span
          aria-hidden
          style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em", color: tint.ink }}
        >
          {tint.code}
        </span>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: published ? INK : "rgba(255,255,255,0.85)",
            color: published ? PAPER : "#4d5f68",
            whiteSpace: "nowrap",
          }}
        >
          {published ? "Published" : lesson.status === "archived" ? "Archived" : "Draft"}
        </span>
      </div>

      <div style={{ padding: "20px 22px 22px" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            color: FAINT,
          }}
        >
          {kicker}
        </div>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 14,
            color: SOFT,
          }}
        >
          <span
            style={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </span>
          <span
            aria-hidden
            style={{
              flex: "none",
              width: 32,
              height: 32,
              borderRadius: 999,
              background: WASH,
              display: "grid",
              placeItems: "center",
              color: INK,
            }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
