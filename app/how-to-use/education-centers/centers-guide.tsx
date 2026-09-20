import type { Metadata } from "next";

import { BODY, DISPLAY, INK, PANEL, SANS, cardStyle, eyebrow } from "@/app/_landing/design";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { RegisterCenterBand } from "@/app/_landing/register-center";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import {
  HTML_LANG,
  LOCALES,
  localePath,
  SOURCE_LOCALE,
  type Locale,
} from "@/lib/i18n/locales";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import { docsCopy } from "../copy";
import { DocsTabs } from "../docs-tabs";
import { CrossLink, DocsHead, Prose, Steps, type DocStep, type InfoTab } from "../docs-ui";
import { CENTERS_PATH, LEARNER_PATH } from "../learner-guide";

/**
 * "How to use EngProgress" — FOR AN EDUCATION CENTRE, in one of three
 * languages.
 *
 * WRITTEN AGAINST THE CODE, NOT AGAINST THE PITCH. Every capability named in
 * `../copy/en.ts` was checked in the console before being written down, and the
 * two that do not exist yet are marked SOON here rather than quietly implied:
 *
 *   · homework covers WRITING, READING, LISTENING and Practice-AI lessons.
 *     There are TWO assign paths and they differ: the group page's
 *     `createAssignment` (console/groups/actions.ts) takes writing | reading |
 *     library, while the practice board (console/practices/actions.ts:249)
 *     takes writing | reading | listening. SPEAKING IS THE ONLY SKILL THAT
 *     CANNOT BE ASSIGNED — an earlier draft of this page wrongly said listening
 *     could not be either, because it had only read the first path.
 *   · the roles are center_admin, administrator, teacher, student
 *     (`AppRole` in lib/auth.ts). "Super admin" is the PLATFORM role and is not
 *     something a centre gets — the centre's owner role is center_admin.
 *
 * ⚠️ AND IT HAS BEEN WRONG BEFORE. Until 2026-09-20 the intro claimed centre
 * students "can practise anything they like", which stopped being true on
 * 2026-08-09 when `isHomeworkOnlyStudent()` started redirecting them from all
 * five skill hubs to /assignments. The page's own "Student" role card described
 * the real behaviour, so it contradicted itself on one screen. If a capability
 * moves, this guide is the thing that goes stale first — and it now goes stale
 * in three languages at once.
 */

export function centersMetadata(locale: Locale): Metadata {
  const { meta } = docsCopy(locale).centers;
  const path = localePath(CENTERS_PATH, locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(CENTERS_PATH, l)])),
        "x-default": localePath(CENTERS_PATH, SOURCE_LOCALE),
      },
    },
    openGraph: {
      type: "article",
      url: path,
      locale: HTML_LANG[locale],
      title: meta.ogTitle,
      description: meta.description,
    },
  };
}

/** Icons are structure, not language. */
const ICONS = ["◆", "⌂", "✎", "▤", "◷", "◈", "◐"] as const;

export function CentersGuide({ locale }: { locale: Locale }) {
  const site = getSiteUrl();
  const c = docsCopy(locale).centers;

  const steps: DocStep[] = c.steps.map((s, i) => ({
    n: `0${i + 1}`,
    title: s.title,
    body: s.body,
  }));

  const overviewPanel = (
    <>
      <Prose paragraphs={[...c.intro]} />

      <div style={{ ...eyebrow(true), marginTop: 40 }}>{c.rolesHeading}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 22,
          marginTop: 20,
        }}
      >
        {c.roles.map((r) => (
          <div key={r.title} style={cardStyle(26)}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, margin: 0 }}>
              {r.title}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: BODY, margin: "10px 0 0" }}>
              {r.body}
            </p>
          </div>
        ))}
      </div>

      <div style={{ ...eyebrow(true), marginTop: 40 }}>{c.startHeading}</div>
      <Steps steps={steps} />
    </>
  );

  const t = c.tabs;
  const tabs: InfoTab[] = [
    { icon: ICONS[0], title: t.overview.title, lede: t.overview.lede, content: overviewPanel },
    { icon: ICONS[1], ...t.people },
    {
      icon: ICONS[2],
      ...t.homework,
      /* ⚠️ `soon` IS SET HERE, NOT IN THE COPY — see the note in
         ../learner-guide.tsx. Speaking is the only skill that cannot be
         assigned to a group, and it is the last point in the list. */
      points: t.homework.points?.map((p, i) =>
        i === (t.homework.points?.length ?? 0) - 1 ? { ...p, soon: true } : p,
      ),
    },
    { icon: ICONS[3], ...t.tracking },
    { icon: ICONS[4], ...t.telegram },
    { icon: ICONS[5], ...t.chat },
    { icon: ICONS[6], ...t.money },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: c.meta.ogTitle,
    description: c.meta.description,
    url: `${site}${localePath(CENTERS_PATH, locale)}`,
    inLanguage: HTML_LANG[locale],
    publisher: { "@type": "Organization", name: SITE_NAME, url: site },
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <LocaleProvider pin={locale}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(HTML_LANG[locale])}`,
        }}
      />
      <div
        className={`${landingSora.variable} ${landingManrope.variable}`}
        style={{ background: PANEL, fontFamily: SANS, color: INK, minHeight: "100%" }}
      >
        <style>{DESIGN_CSS}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SiteHeader />

        <main
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            flexWrap: "wrap",
            gap: 56,
          }}
        >
          <DocsTabs
            tabs={tabs}
            label={c.label}
            elsewhere={{ label: c.elsewhere, href: localePath(LEARNER_PATH, locale) }}
            head={<DocsHead kicker={c.head.kicker} title={c.head.title} lede={c.head.lede} />}
            footer={
              <>
                <RegisterCenterBand />
                <CrossLink
                  kicker={c.cross.kicker}
                  title={c.cross.title}
                  body={c.cross.body}
                  cta={c.cross.cta}
                  href={localePath(LEARNER_PATH, locale)}
                />
              </>
            }
          />
        </main>

        <CentersBand />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
