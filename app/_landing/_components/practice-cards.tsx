import Link from "next/link";
import { BookOpen, Headphones, Lock, Mic, PenLine } from "lucide-react";

import type { MessageKey, Translate } from "@/lib/i18n";
import { freePracticePage, signInFor, type PracticeCardSkill } from "@/lib/free-practice/links";

import {
  BODY,
  BRAND,
  BRAND_TINT,
  BRAND_TINT_LINE,
  COVER_RING,
  DISPLAY,
  INK,
  MUTED,
  RADIUS,
  SANS,
  SKILL_COVER,
  WHITE,
} from "../_lib/design";
import { GeneratedCover } from "./blog-stories";

/**
 * The free practice on the landing page: one card per skill, deliberately the
 * same card as a blog story (`bl-story` / `bl-card`, the generated cover, the
 * stretched headline link), so the section reads as "today's news" beside the
 * articles. The practice pages list their twenty in the same style — see
 * app/practice/[skill]/_components/free-practice-grid.tsx.
 *
 * Server components; the caller passes `t`.
 */

const SKILL_NAME: Record<PracticeCardSkill, MessageKey> = {
  writing: "nav.writing",
  reading: "nav.reading",
  listening: "nav.listening",
  speaking: "nav.speaking",
};

/** The icon each skill's cover shows before its name — the practice pages'
 *  covers do the same, per practice (owner, 2026-09-27). Coloured and sized by
 *  `.bl-kicker-icon`, never through the SVG's own attribute. */
const SKILL_ICON: Record<PracticeCardSkill, React.ReactNode> = {
  writing: <PenLine strokeWidth={1.6} />,
  reading: <BookOpen strokeWidth={1.6} />,
  listening: <Headphones strokeWidth={1.6} />,
  speaking: <Mic strokeWidth={1.6} />,
};

const SKILL_META: Record<PracticeCardSkill, MessageKey> = {
  writing: "free.writingMeta",
  reading: "free.readingMeta",
  listening: "free.listeningMeta",
  speaking: "free.speakingMeta",
};

/** A chip laid over a cover — white on the cover's dark ground, both themes. */
function CoverChip({ locked, label }: { locked: boolean; label: string }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
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
      {locked ? <Lock size={12} strokeWidth={2.4} aria-hidden /> : null}
      {label}
    </span>
  );
}

/* ── the landing section's four cards ──────────────────────────────────── */

/**
 * One skill on the landing page. Writing, Reading and Listening go to their
 * page of dated practices; Speaking is locked and goes to sign-in.
 */
export function SkillPracticeCard({ skill, t }: { skill: PracticeCardSkill; t: Translate }) {
  const locked = skill === "speaking";
  const href = locked ? signInFor("speaking") : freePracticePage(skill);
  const { a, b } = SKILL_COVER[skill];
  return (
    <article className="bl-story bl-card" style={locked ? { opacity: 0.86 } : undefined}>
      <GeneratedCover a={a} b={b} icon={SKILL_ICON[skill]} kicker={t(SKILL_NAME[skill])} seedKey={skill} radius={14}>
        <CoverChip locked={locked} label={locked ? t("free.signIn") : t("free.freeToday")} />
      </GeneratedCover>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <h3
          style={{
            fontFamily: DISPLAY,
            fontWeight: 600,
            fontSize: "clamp(18px,1.7vw,21px)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          <Link href={href} className="bl-hl">
            {t(SKILL_NAME[skill])}
          </Link>
        </h3>
        <p className="bl-dek" style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.55, color: BODY, margin: 0 }}>
          {t(SKILL_META[skill])}
        </p>
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: locked ? MUTED : BRAND }}>
          {locked ? t("free.signInToPractise") : t("free.seeToday")} →
        </span>
      </div>
    </article>
  );
}

/**
 * The sign-in recommendation on the free-practice pages — the owner's rule
 * that every use of a free practice says a free account brings more of them.
 * On the page, not only in the runner, so it is read before the first
 * practice as well as after it.
 */
export function MorePracticeBanner({ skill, t }: { skill: PracticeCardSkill; t: Translate }) {
  return (
    <aside
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        margin: "0 0 clamp(24px,3.5vw,36px)",
        padding: "14px 18px",
        borderRadius: 16,
        background: BRAND_TINT,
        border: `1px solid ${BRAND_TINT_LINE}`,
        fontFamily: SANS,
      }}
    >
      <p style={{ margin: 0, flex: "1 1 320px", fontSize: 15, lineHeight: 1.55, color: INK }}>{t("free.moreBody")}</p>
      <Link href={signInFor(skill)} className="lp-ghost" style={{ fontWeight: 700, fontSize: 14.5, color: BRAND, textDecoration: "none" }}>
        {t("free.moreCta")} →
      </Link>
    </aside>
  );
}

