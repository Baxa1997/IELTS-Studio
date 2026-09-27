import Link from "next/link";
import { BarChart3, BookOpen, Headphones, Mail, PenLine } from "lucide-react";

import { GeneratedCover } from "@/app/_landing/_components/blog-stories";
import {
  BRAND,
  COVER_RING,
  DISPLAY,
  INK,
  MUTED,
  RADIUS,
  SANS,
  SKILL_COVER,
  WHITE,
  solidButton,
} from "@/app/_landing/_lib/design";
import type { PoolItem } from "@/lib/free-practice/assignment";
import { freeRunner } from "@/lib/free-practice/links";
import type { FreeSkill } from "@/lib/free-practice/rotation";
import type { Translate } from "@/lib/i18n";

/**
 * The free practice list in the BLOG's card style — the generated cover, the
 * headline, the stretched link (`bl-story` / `bl-lead` / `bl-card` from
 * blog-css.ts) — so the page reads as the same newsroom as the landing page
 * and the articles.
 *
 * ⚠️ FOUR OWNER CALLS ON ONE DAY (2026-09-27), all pinned by tests:
 *  - not the signed-in hubs' PracticeCard ("no practice card");
 *  - the blog's covered card, kept ("design as previous");
 *  - the cover shows the practice's ICON before its title;
 *  - that title is the TEST'S NUMBER ("Test 12"), and under it whether this
 *    is the whole test or a part of it ("Full reading" / "Part reading") —
 *    the practices are mostly full tests now, and a visitor should see which
 *    is which before opening one.
 * The PRACTICE behind each card is the signed-in one: the same runner, the
 * same grading, on our own free page.
 *
 * Today's new practice leads, wide; the rest of the visitor's twenty follow in
 * the grid. Every card opens — when today's free practice is already used, the
 * runner page says so and recommends signing in, rather than the card locking.
 */

/**
 * Which icon a practice's cover shows. Writing's three tasks are three
 * different jobs — describe a chart, write a letter, argue a case — so they are
 * told apart at a glance; a reading passage and a listening part are one thing
 * each. Returned as an element, not a component: choosing a component in a
 * variable during render is what the React Compiler refuses. Its colour and
 * size come from `.bl-kicker-icon` — see the note there.
 */
function coverIcon(skill: FreeSkill, item: PoolItem): React.ReactNode {
  const props = { strokeWidth: 1.6 };
  if (skill === "reading") return <BookOpen {...props} />;
  if (skill === "listening") return <Headphones {...props} />;
  if (item.kind === "Academic Task 1") return <BarChart3 {...props} />;
  if (item.kind === "General Training Task 1") return <Mail {...props} />;
  return <PenLine {...props} />;
}

/** The line under "Test N": the whole test, or one part of it. A writing
 *  task is neither — the exam's Writing test is both tasks — so it names the
 *  task instead. */
const FORMAT_LABEL = {
  reading: { full: "free.fullReading", part: "free.partReading" },
  listening: { full: "free.fullListening", part: "free.partListening" },
} as const;

function formatLabel(skill: FreeSkill, item: PoolItem, t: Translate): string {
  if (skill === "writing") return t("free.writingTask", { n: item.kind?.endsWith("Task 2") ? 2 : 1 });
  return t(FORMAT_LABEL[skill][item.format === "full" ? "full" : "part"]);
}

/** Everything a cover takes from the practice. */
function coverOf(skill: FreeSkill, item: PoolItem, t: Translate) {
  return {
    icon: coverIcon(skill, item),
    kicker: t("free.testNo", { n: item.testNo }),
    caption: formatLabel(skill, item, t),
  };
}

/** A full test's headline lists its three or four passages or recordings, so
 *  it is held to three lines; the card's facts already say what it is. */
const CLAMP: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The line above a headline: what it is · topic · time · questions. */
function Facts({ item, t }: { item: PoolItem; t: Translate }) {
  const topic = item.topic && item.topic !== "custom" ? titleCase(item.topic) : null;
  const parts = [
    [item.kind, topic].filter(Boolean).join(" · ") || null,
    t("free.minutes", { n: item.minutes }),
    item.questions ? t("free.questions", { n: item.questions }) : null,
  ].filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontFamily: SANS, fontSize: 13, color: MUTED }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: "inline-flex", gap: 10 }}>
          {i > 0 ? <span aria-hidden>·</span> : null}
          {p}
        </span>
      ))}
    </div>
  );
}

/** A chip laid over a cover — white on the cover's dark ground, both themes. */
function CoverChip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: COVER_RING,
        color: WHITE,
        borderRadius: RADIUS.pill,
        padding: "5px 11px",
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".04em",
        backdropFilter: "blur(6px)",
      }}
    >
      {label}
    </span>
  );
}

/** Today's new practice, wide across the top of the list. */
function LeadPractice({ skill, item, t }: { skill: FreeSkill; item: PoolItem; t: Translate }) {
  const { a, b } = SKILL_COVER[skill];
  const href = freeRunner(skill, item.key);
  return (
    <article className="bl-story bl-lead">
      <GeneratedCover a={a} b={b} {...coverOf(skill, item, t)} seedKey={item.key} radius={20}>
        <CoverChip label={t("free.newToday")} />
      </GeneratedCover>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Facts item={item} t={t} />
        <h2
          lang="en"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: "clamp(24px,3vw,34px)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: INK,
            margin: 0,
            textWrap: "balance",
            ...CLAMP,
          }}
        >
          <Link href={href} className="bl-hl">
            {item.title}
          </Link>
        </h2>
        <div style={{ marginTop: 6 }}>
          {/* Covered by the headline's stretched link, so it goes to the same
              place — it is here to look like the thing to press. */}
          <span className="lp-solid" style={{ ...solidButton("md"), display: "inline-block" }}>
            {t("common.start")} →
          </span>
        </div>
      </div>
    </article>
  );
}

/** One of the rest of the visitor's twenty. */
function PracticeStory({ skill, item, t }: { skill: FreeSkill; item: PoolItem; t: Translate }) {
  const { a, b } = SKILL_COVER[skill];
  return (
    <article className="bl-story bl-card">
      <GeneratedCover a={a} b={b} {...coverOf(skill, item, t)} seedKey={item.key} radius={14} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <Facts item={item} t={t} />
        <h3
          lang="en"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: "clamp(17px,1.6vw,19px)",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            margin: 0,
            ...CLAMP,
          }}
        >
          <Link href={freeRunner(skill, item.key)} className="bl-hl">
            {item.title}
          </Link>
        </h3>
        <span className="bl-dek" style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: BRAND }}>
          {t("common.start")} →
        </span>
      </div>
    </article>
  );
}

export function FreePracticeGrid({
  skill,
  items,
  t,
}: {
  skill: FreeSkill;
  items: PoolItem[];
  t: Translate;
}) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <>
      <LeadPractice skill={skill} item={lead} t={t} />
      {rest.length > 0 ? (
        <div className="bl-grid" style={{ marginTop: "clamp(32px,5vw,48px)" }}>
          {rest.map((item) => (
            <PracticeStory key={item.key} skill={skill} item={item} t={t} />
          ))}
        </div>
      ) : null}
    </>
  );
}
