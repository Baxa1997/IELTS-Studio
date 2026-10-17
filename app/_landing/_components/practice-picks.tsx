"use client";

import Link from "next/link";
import { createContext, Fragment, useContext, useEffect, useState } from "react";

import { formatLabel } from "@/lib/free-practice/labels";
import { PRACTICE_CARD_SKILLS, type PracticeCardSkill } from "@/lib/free-practice/links";
import type { PracticePick } from "@/lib/free-practice/picks";
import type { FreeSkill } from "@/lib/free-practice/rotation";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/shared/components/i18n/locale-provider";

import { featuredSkill } from "../_lib/featured-pick";
import { BODY, CTA_LINE, DISPLAY, SANS, ctaPill, eyebrow, outlinePill } from "../_lib/design";

/**
 * "Picked for you" — the landing page's practice section as a recommendation:
 * one practice to START HERE, then the rest of the visitor's picks (owner,
 * 2026-10-17: "cards keep, but the section restructured as a recommendation").
 *
 * ⚠️ FETCHED IN THE BROWSER, ON PURPOSE. Which practice is a visitor's comes
 * from their cookie, and the front door is static and cached — reading the
 * cookie there would make every visit a server render. So the server renders
 * every skill's card with its generic copy, and this asks
 * /api/public/practice/picks which practice is the visitor's. A failed or slow
 * answer leaves the generic cards, which are complete on their own.
 *
 * ⚠️ THE SAME CARDS IN BOTH PLACES. The server hands over one rendered card
 * per skill; this only decides which goes in the "Start here" frame and which
 * in the row (../_lib/featured-pick), and the frame lays its card out wide in
 * CSS (`.lp-pick-featured` in blog-css). No second card design to drift.
 *
 * ⚠️ ONE LAYOUT FOR BOTH STATES. The visitor's practice lands in the SAME
 * slots as the generic copy — a title held to two lines, a facts line held to
 * two, then the button — so the row does not jump when the picks arrive.
 */
const PICKS_URL = "/api/public/practice/picks";

type Picks = Partial<Record<FreeSkill, PracticePick>>;

const PicksContext = createContext<Picks | null>(null);
/** True inside the "Start here" frame, where the card's text sets larger. */
const FeaturedContext = createContext(false);

/**
 * The section's cards: the "Start here" frame, then "More picked for you".
 * `cards` is every skill's server-rendered card, keyed by skill.
 */
export function PracticePicks({
  cards,
  moreLabel,
}: {
  cards: Record<PracticeCardSkill, React.ReactNode>;
  moreLabel: string;
}) {
  const [picks, setPicks] = useState<Picks | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(PICKS_URL, { signal: ctrl.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ picks?: PracticePick[] }>) : null))
      .then((data) => {
        if (data?.picks?.length)
          setPicks(Object.fromEntries(data.picks.map((p) => [p.skill, p])) as Picks);
      })
      .catch(() => {
        // Aborted on unmount, or offline: the generic cards stand.
      });
    return () => ctrl.abort();
  }, []);

  const featured = featuredSkill(picks);
  return (
    <PicksContext.Provider value={picks}>
      <div className="lp-pick-featured" style={{ marginTop: 36 }}>
        <FeaturedContext.Provider value={true}>{cards[featured]}</FeaturedContext.Provider>
      </div>
      <p style={{ ...eyebrow(), margin: "clamp(30px,4vw,44px) 0 0" }}>{moreLabel}</p>
      <div className="bl-grid bl-grid-4" style={{ marginTop: 18 }}>
        {PRACTICE_CARD_SKILLS.filter((skill) => skill !== featured).map((skill) => (
          <Fragment key={skill}>{cards[skill]}</Fragment>
        ))}
      </div>
    </PicksContext.Provider>
  );
}

/** Speaking has no free practice, so it never has a pick. */
function usePick(skill: PracticeCardSkill): PracticePick | null {
  const picks = useContext(PicksContext);
  return skill === "speaking" ? null : (picks?.[skill] ?? null);
}

/** The practice's facts, as its card on the practice page lists them:
 *  "Test 12 · Full reading · 60 min · 40 questions". */
function factsOf(pick: PracticePick, t: Translate): string {
  return [
    t("free.testNo", { n: pick.testNo }),
    formatLabel(pick.skill, pick, t),
    t("free.minutes", { n: pick.minutes }),
    pick.questions ? t("free.questions", { n: pick.questions }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The chip on the cover: the server's "Free today" until the pick arrives. */
export function PickChipLabel({ skill, fallback }: { skill: FreeSkill; fallback: string }) {
  const t = useT();
  const pick = usePick(skill);
  if (!pick) return <>{fallback}</>;
  return <>{pick.done ? t("free.usedChip") : t("free.pickChip")}</>;
}

/** Two lines, always: a one-line title reserves the second, so swapping the
 *  skill's name for a practice's title cannot grow the card. */
const TITLE: React.CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 600,
  fontSize: "clamp(17px,1.6vw,19px)",
  lineHeight: 1.25,
  letterSpacing: "-0.02em",
  margin: 0,
  minHeight: "2.5em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

/** The "Start here" card's title: larger, and three lines, with nothing beside
 *  it in its row to keep level with. */
const TITLE_FEATURED: React.CSSProperties = {
  ...TITLE,
  fontSize: "clamp(22px,2.4vw,30px)",
  lineHeight: 1.2,
  minHeight: 0,
  WebkitLineClamp: 3,
};

/** ⚠️ The two-line clamp itself is the `lp-pick-facts` class, not inline: an
 *  inline `display` would beat the phone rule that hides a row card's line. */
const FACTS: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 14,
  lineHeight: 1.5,
  color: BODY,
  margin: 0,
  minHeight: "3em",
};

const FACTS_FEATURED: React.CSSProperties = { ...FACTS, fontSize: 15.5, minHeight: 0 };

/**
 * A skill card's text. Without a pick: the skill's name, its one-line
 * description and "See today's practice", all to the skill's practice page.
 * With one: the practice's own title (English, like the practice), its facts
 * and Start, straight into its runner — or, once today's free practice in the
 * skill is used, the way to more of it. `locked` is Speaking: the same slots,
 * with an outlined sign-in instead of the orange Start. In the "Start here"
 * frame it says so, and sets larger.
 */
export function PickBody({
  skill,
  fallback,
  locked = false,
}: {
  skill: PracticeCardSkill;
  fallback: { href: string; title: string; meta: string; cta: string };
  locked?: boolean;
}) {
  const t = useT();
  const pick = usePick(skill);
  const featured = useContext(FeaturedContext);
  const href = pick ? (pick.done ? pick.signInHref : pick.href) : fallback.href;
  const cta = pick
    ? pick.done
      ? t("free.usedCta")
      : featured
        ? t("free.startNow")
        : t("common.start")
    : fallback.cta;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: featured ? 12 : 10,
        minWidth: 0,
        flex: 1,
      }}
    >
      {featured ? (
        <span style={{ ...eyebrow(), color: CTA_LINE }}>{t("free.startHere")}</span>
      ) : null}
      <h3 lang={pick ? "en" : undefined} style={featured ? TITLE_FEATURED : TITLE}>
        <Link href={href} className="bl-hl">
          {pick ? pick.title : fallback.title}
        </Link>
      </h3>
      <p className="bl-dek lp-pick-facts" style={featured ? FACTS_FEATURED : FACTS}>
        {pick ? factsOf(pick, t) : fallback.meta}
      </p>
      {/* Decoration: the headline's stretched link covers the card, so this
          is what to press rather than a second link. */}
      <span
        style={{
          ...(locked ? outlinePill() : ctaPill()),
          ...(featured ? { fontSize: 15.5, padding: "12px 24px" } : null),
          alignSelf: "flex-start",
          marginTop: featured ? 6 : "auto",
        }}
      >
        {cta} →
      </span>
    </div>
  );
}
