import type { Metadata } from "next";

import { INK, PANEL, SANS, eyebrow } from "@/app/_landing/design";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALES,
  localePath,
  SOURCE_LOCALE,
  type Locale,
} from "@/lib/i18n/locales";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import { docsCopy } from "./copy";
import { DocsTabs } from "./docs-tabs";
import {
  Callout,
  CrossLink,
  DocsHead,
  FeatureList,
  Prose,
  Steps,
  type DocStep,
  type Feature,
  type InfoTab,
} from "./docs-ui";

/**
 * "How to use EngProgress" — FOR AN INDIVIDUAL LEARNER, in one of three
 * languages.
 *
 * ⚠️ IT TAKES ITS LOCALE FROM THE URL, NOT FROM THE COOKIE, for the reason
 * `landing-page.tsx` sets out at length: a cookie is invisible to a crawler, so
 * a cookie-only page has exactly one indexable version however many languages
 * it can render. `/how-to-use` is Uzbek, `/en/how-to-use` and `/ru/how-to-use`
 * are real routes, and the three declare each other with `hreflang`.
 *
 * THE LEFT SIDEBAR IS THE TAB LIST (owner's call, arrived at the hard way).
 * Every entry in it is clickable and swaps the panel beside it; there is no
 * second tab strip inside the page, and nothing is stacked down a long scroll.
 * If you are adding a section it is a tab, or it goes inside one. `DocsTabs`
 * owns both halves because they share the active-tab state.
 *
 * The ORDER is still Diátaxis-shaped (diataxis.fr): a reader who lands here has
 * bought nothing and is asking "what is this and how does it work", which is
 * the explanation quadrant. Overview answers that; the skill tabs go a level
 * deeper on demand; "Getting started" — the only how-to on the page — sits at
 * the bottom of Overview rather than competing with it.
 *
 * ⚠️ THE COPY IS NOT IN THIS FILE and not in `lib/i18n/messages` either. It is
 * in `./copy`, server-side, because the message dictionary ships to the browser
 * on every route and these two guides are about 7,000 words each. See
 * `./copy/types.ts`.
 *
 * Top-level rather than inside `(marketing)`: that group's layout applies its
 * own chrome, and this page wears the canvas chrome.
 */

export const LEARNER_PATH = "/how-to-use";
export const CENTERS_PATH = "/how-to-use/education-centers";

/** Icons are structure, not language, so they stay here rather than in `copy`. */
const ICONS = ["◆", "✎", "▤", "◷", "✦", "◈", "◉", "◇"] as const;

export function learnerMetadata(locale: Locale): Metadata {
  const { meta } = docsCopy(locale).learner;
  const path = localePath(LEARNER_PATH, locale);
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      /* Without this the three compete as near-duplicates. `x-default` follows
         SOURCE_LOCALE rather than the default locale — the visitor whose
         language matches none of the three is not an Uzbek speaker. Same rule
         as `landingMetadata`. */
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [HTML_LANG[l], localePath(LEARNER_PATH, l)])),
        "x-default": localePath(LEARNER_PATH, SOURCE_LOCALE),
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

export function LearnerGuide({ locale }: { locale: Locale }) {
  const site = getSiteUrl();
  const c = docsCopy(locale).learner;

  /* Every list below is BUILT FROM THE COPY rather than written out again, so a
     language that gains or loses an entry cannot leave a stale parallel array
     behind — the trap this repo files under "derive, do not spell out". */
  const features: Feature[] = c.features.map((f) => ({ title: f.title, body: f.body }));
  const steps: DocStep[] = c.steps.map((s, i) => ({
    n: `0${i + 1}`,
    title: s.title,
    body: s.body,
  }));

  const overviewPanel = (
    <>
      <Prose paragraphs={[...c.overview]} />

      <div style={{ ...eyebrow(true), marginTop: 40 }}>{c.featuresHeading}</div>
      <FeatureList features={features} />

      <Callout kicker={c.callout.kicker}>{c.callout.body}</Callout>

      <div style={{ ...eyebrow(true), marginTop: 40 }}>{c.startHeading}</div>
      <Steps steps={steps} />
    </>
  );

  const t = c.tabs;
  const tabs: InfoTab[] = [
    { icon: ICONS[0], title: t.overview.title, lede: t.overview.lede, content: overviewPanel },
    { icon: ICONS[1], ...t.writing },
    { icon: ICONS[2], ...t.reading },
    { icon: ICONS[3], ...t.listening },
    { icon: ICONS[4], ...t.speaking },
    { icon: ICONS[5], ...t.cambridge },
    { icon: ICONS[6], ...t.coaching },
    {
      icon: ICONS[7],
      ...t.cefr,
      /* ⚠️ `soon` IS SET HERE, NOT IN THE COPY. Whether a feature has shipped is
         a fact about the product, not about a language — leaving the flag in
         the dictionaries would let a translation quietly mark a live feature as
         coming soon, or a missing one as done. The CEFR tab's last point is the
         only unbuilt thing on this page. */
      points: t.cefr.points?.map((p, i) =>
        i === (t.cefr.points?.length ?? 0) - 1 ? { ...p, soon: true } : p,
      ),
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: c.meta.ogTitle,
    description: c.meta.description,
    url: `${site}${localePath(LEARNER_PATH, locale)}`,
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
    /* ⚠️ `pin`, NOT `initial`: the page's own locale, and the cookie does not
       get a vote. On /en/how-to-use the page is English whatever `ep-locale`
       says, so the client chrome inside — header, picker, theme toggle — has to
       STAY there, not merely start there. Same reasoning as the landing page,
       where `initial` shipped an Uzbek page wearing an English header. */
    <LocaleProvider pin={locale}>
      {/* The root layout is static and sets `<html lang>` to the default, so a
          generated /ru page would claim to be Uzbek — wrong for a screen reader
          picking its voice and for the browser's offer to translate. Corrected
          before first paint, the same trick as the theme's no-flash script. */}
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
            /* ⚠️ THE CROSS-LINKS CARRY THE LOCALE. A bare "/how-to-use/…" here
               would drop a Russian reader back onto the Uzbek page, which is
               the failure nobody notices in review because it only shows up
               after a click. */
            elsewhere={{ label: c.elsewhere, href: localePath(CENTERS_PATH, locale) }}
            head={<DocsHead kicker={c.head.kicker} title={c.head.title} lede={c.head.lede} />}
            footer={
              <CrossLink
                kicker={c.cross.kicker}
                title={c.cross.title}
                body={c.cross.body}
                cta={c.cross.cta}
                href={localePath(CENTERS_PATH, locale)}
              />
            }
          />
        </main>

        <CentersBand />
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}

/** `DEFAULT_LOCALE` is re-exported so the two routes cannot disagree about it. */
export { DEFAULT_LOCALE };
