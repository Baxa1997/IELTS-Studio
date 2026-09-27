import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MorePracticeBanner } from "@/app/_landing/_components/practice-cards";
import { BODY, DISPLAY, FAINT, GREEN, INK, LEDE, LINE, RULE, SANS, eyebrow } from "@/app/_landing/_lib/design";
import { practiceList } from "@/lib/free-practice/assignment";
import { freePracticePage, signInFor } from "@/lib/free-practice/links";
import { FREE_SKILLS, isFreeSkill, type FreeSkill } from "@/lib/free-practice/rotation";
import { translator, type MessageKey } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import { FreePracticeGrid } from "./_components/free-practice-grid";

/**
 * /practice/[skill] — the free practice page for one skill: twenty practices
 * picked for this visitor, in the blog's card style, today's new one leading. Any card opens its practice on our free runner (never the
 * dashboard); one practice a day is free, and once it is used the runner says
 * so and recommends signing in (owner, 2026-09-27).
 *
 * WHICH practice sits on each card is this visitor's own (see
 * lib/free-practice/rotation), so the page reads a cookie — which is what makes
 * it render per request; no `dynamic` export is needed or wanted beside
 * `generateStaticParams`. `dynamicParams = false` keeps any
 * other segment, Speaking included, a real 404: Speaking has no free practice,
 * and its card on the landing page goes straight to sign-in.
 *
 * English chrome, like the blog: the practice itself is English, and a page
 * that switched language halfway down would read as a mistake.
 */
export const dynamicParams = false;

export function generateStaticParams(): { skill: FreeSkill }[] {
  return FREE_SKILLS.map((skill) => ({ skill }));
}

const t = translator(SOURCE_LOCALE);

const TITLE: Record<FreeSkill, MessageKey> = {
  writing: "free.pageTitleWriting",
  reading: "free.pageTitleReading",
  listening: "free.pageTitleListening",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skill: string }>;
}): Promise<Metadata> {
  const { skill } = await params;
  if (!isFreeSkill(skill)) return {};
  return {
    title: t(TITLE[skill]),
    description: t("free.metaDesc"),
    alternates: { canonical: freePracticePage(skill) },
  };
}

export default async function FreePracticePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isFreeSkill(skill)) notFound();

  const { items, done } = await practiceList(skill);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(32px,5vw,60px) clamp(16px,4vw,28px) 72px",
      }}
    >
      <header style={{ marginBottom: "clamp(28px,4vw,44px)" }}>
        <div style={eyebrow(true)}>{t("free.pageEyebrow")}</div>
        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 500,
            fontSize: "clamp(27px,3.3vw,40px)",
            lineHeight: 1.14,
            letterSpacing: "-0.03em",
            margin: "14px 0 0",
          }}
        >
          {t(TITLE[skill])}
        </h1>
        <p style={{ ...LEDE, maxWidth: 680, margin: "14px 0 0" }}>{t("free.pageLead")}</p>
      </header>

      <MorePracticeBanner skill={skill} t={t} />

      {/* Today's status: the one free practice is ready, or it is used — the
          second line is the recommendation to sign in, again. */}
      <p
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "0 0 18px",
          fontFamily: SANS,
          fontSize: 14.5,
          fontWeight: 600,
          color: done ? BODY : GREEN,
        }}
      >
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 999, background: done ? FAINT : GREEN, flex: "none" }}
        />
        {done ? t("free.usedToday") : t("free.availableToday")}
      </p>

      <FreePracticeGrid skill={skill} items={items} t={t} />

      <OtherSkills current={skill} />

      <p
        style={{
          fontSize: 13,
          color: FAINT,
          lineHeight: 1.55,
          margin: "40px 0 0",
          paddingTop: 18,
          borderTop: `1px solid ${RULE}`,
        }}
      >
        {t("lp.disclaimer")}
      </p>
    </div>
  );
}

/** The other two free skills, and Speaking behind sign-in. */
function OtherSkills({ current }: { current: FreeSkill }) {
  const NAME: Record<FreeSkill | "speaking", MessageKey> = {
    writing: "nav.writing",
    reading: "nav.reading",
    listening: "nav.listening",
    speaking: "nav.speaking",
  };
  const links = [
    ...FREE_SKILLS.filter((s) => s !== current).map((s) => ({ href: freePracticePage(s), label: t(NAME[s]) })),
    { href: signInFor("speaking"), label: `${t(NAME.speaking)} · ${t("free.signIn")}` },
  ];
  return (
    <nav
      aria-label={t("free.otherSkills")}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 40 }}
    >
      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 700, color: FAINT, marginRight: 4 }}>
        {t("free.otherSkills")}
      </span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="lp-ghost"
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            color: INK,
            textDecoration: "none",
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            padding: "8px 16px",
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
