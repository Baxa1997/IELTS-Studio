import type { Metadata } from "next";

import { BODY, DISPLAY, INK, SANS, WHITE } from "@/app/_landing/_lib/design";
import { freePracticePage } from "@/lib/free-practice/links";
import { localePath, type Locale } from "@/lib/i18n/locales";

import { LocalisedFrame } from "@/app/_landing/_components/localised-frame";
import { SectionHead, ToolCross, ToolCta, ToolDisclaimer, ToolFaq, ToolHero } from "../../_components/tool-sections";
import { toolsCopy } from "../../_lib/copy";
import { IELTS_CALCULATOR_PATH, MULTILEVEL_CALCULATOR_PATH, PHOTOS, toolGraph, toolMetadata } from "../../_lib/page-meta";
import { MULTILEVEL_LEVELS, RATER_SCALE } from "../../_lib/scores";
import { MULTILEVEL_GROUND, levelBackground, TOOL_CSS } from "../../_lib/tool-css";

import { MultilevelCalculator } from "./multilevel-calculator";

/**
 * The Multilevel (CEFR) score calculator, in one language — see
 * `ielts-page.tsx` for why one component serves all three URLs.
 *
 * WRITTEN FROM THE AGENCY'S OWN DOCUMENT, not from the explainer sites, which
 * disagree with each other (one describes a 120-point scale). The 2023 scoring
 * criteria give the thresholds, the averaging of the four sections, and the
 * Writing/Speaking conversion table; `scores.ts` names the file.
 *
 * Uzbek searches drive this page: "multilevel ball hisoblash", "cefr ballari
 * qanday hisoblanadi" and "cefr baholash jadvali" are all live suggestions, so
 * /uz/multilevel-score-calculator is the version most of its visitors want.
 */

export function multilevelCalculatorMetadata(locale: Locale): Metadata {
  const { multilevel } = toolsCopy(locale);
  return toolMetadata(MULTILEVEL_CALCULATOR_PATH, locale, multilevel.meta, PHOTOS.multilevel, multilevel.hero.photoAlt);
}

export function MultilevelCalculatorPage({ locale }: { locale: Locale }) {
  const { chrome, multilevel: c, ielts } = toolsCopy(locale);
  const graph = toolGraph({
    path: MULTILEVEL_CALCULATOR_PATH,
    locale,
    name: c.hero.title,
    description: c.meta.description,
    home: chrome.home,
    faq: c.faq,
    photo: PHOTOS.multilevel,
  });

  return (
    <LocalisedFrame locale={locale} structuredData={graph} css={[TOOL_CSS]}>
      <main>
        <ToolHero hero={c.hero} chrome={chrome} locale={locale} photo={PHOTOS.multilevel} />

        <section className="tl-shell tl-section" id="calculator" aria-labelledby="calc-title">
          <SectionHead id="calc-title" kicker={c.hero.eyebrow} title={c.overall.title} hint={c.overall.hint} />
          <div style={{ marginTop: 26 }}>
            <MultilevelCalculator copy={{ overall: c.overall, rater: c.rater, correct: c.correct, levelNames: c.levelNames }} />
          </div>
        </section>

        <section className="tl-shell tl-section" aria-labelledby="tables-title">
          <SectionHead id="tables-title" kicker={c.tables.eyebrow} title={c.tables.title} hint={c.tables.hint} />
          <div className="tl-card" style={{ marginTop: 26, padding: 20 }}>
            <table className="tl-table">
              <thead>
                <tr>
                  <th scope="col">{c.tables.level}</th>
                  <th scope="col">{c.tables.score}</th>
                  <th scope="col">{c.tables.correct}</th>
                </tr>
              </thead>
              <tbody>
                {MULTILEVEL_LEVELS.map((l) => (
                  <tr key={l.level}>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          minWidth: 64,
                          textAlign: "center",
                          padding: "5px 10px",
                          borderRadius: 999,
                          backgroundImage: levelBackground(MULTILEVEL_GROUND[l.level]),
                          color: WHITE,
                          fontWeight: 700,
                        }}
                      >
                        {c.levelNames[l.level]}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {l.from}–{l.to}
                    </td>
                    <td>
                      {l.correct[0]}–{l.correct[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: INK, margin: "34px 0 6px" }}>{c.tables.raterTitle}</h3>
          <p style={{ fontFamily: SANS, fontSize: 15.5, lineHeight: 1.55, color: BODY, margin: "0 0 16px" }}>{c.tables.raterHint}</p>
          {/* All 66 rows, highest first, as the agency prints them — a list a
              teacher can check a mark against, and the "baholash jadvali" a
              search lands on. */}
          <div className="tl-grid-table" role="list" aria-label={c.tables.raterTitle}>
            {RATER_SCALE.map(([low, high, score]) => (
              <div key={score} className="tl-cell" role="listitem">
                <span>
                  {low.toFixed(1)}–{high.toFixed(1)}
                </span>
                <b>{score}</b>
              </div>
            ))}
          </div>
        </section>

        <ToolCross
          chrome={chrome}
          cross={c.cross}
          href={localePath(IELTS_CALCULATOR_PATH, locale)}
          photo={PHOTOS.ielts}
          photoAlt={ielts.hero.photoAlt}
        />
        <ToolCta chrome={chrome} practice={[{ label: c.practiceLink, href: freePracticePage("cefr") }]} />
        <ToolFaq chrome={chrome} faq={c.faq} />
        <ToolDisclaimer chrome={chrome} />
      </main>
    </LocalisedFrame>
  );
}
