import type { Metadata } from "next";

import { DISPLAY, INK, MUTED, SANS, WHITE } from "@/app/_landing/_lib/design";
import { freePracticePage } from "@/lib/free-practice/links";
import { localePath, type Locale } from "@/lib/i18n/locales";

import { ToolFrame } from "../../_components/tool-frame";
import { SectionHead, ToolCross, ToolCta, ToolDisclaimer, ToolFaq, ToolHero } from "../../_components/tool-sections";
import { fill, toolsCopy, type IeltsCopy } from "../../_lib/copy";
import { IELTS_CALCULATOR_PATH, MULTILEVEL_CALCULATOR_PATH, PHOTOS, toolGraph, toolMetadata } from "../../_lib/page-meta";
import { IELTS_CEFR, rawRanges, type RawTable } from "../../_lib/scores";
import { levelBackground } from "../../_lib/tool-css";

import { IeltsCalculator } from "./ielts-calculator";

/**
 * The IELTS band score calculator, in one language — rendered by
 * `/ielts-band-score-calculator` and by `/uz/…` and `/ru/…`, the way the
 * learner guide is, so the three can never drift into three different pages.
 *
 * THE MOST-SEARCHED IELTS TOOL IN UZBEKISTAN. "ielts calculator" is Google's
 * third suggestion for plain "ielts" there (autocomplete, 2026-10-17), ahead of
 * registration and test centres, and "ielts score table" / "how ielts score is
 * calculated" follow close behind — which is why the tables and the rounding
 * rule are on the page in text, not only inside the widget.
 */

export function ieltsCalculatorMetadata(locale: Locale): Metadata {
  const { ielts } = toolsCopy(locale);
  return toolMetadata(IELTS_CALCULATOR_PATH, locale, ielts.meta, PHOTOS.ielts, ielts.hero.photoAlt);
}

const TABLES: RawTable[] = ["listening", "academicReading", "generalReading"];

export function IeltsCalculatorPage({ locale }: { locale: Locale }) {
  const { chrome, ielts: c, multilevel } = toolsCopy(locale);
  const graph = toolGraph({
    path: IELTS_CALCULATOR_PATH,
    locale,
    name: c.hero.title,
    description: c.meta.description,
    home: chrome.home,
    faq: c.faq,
    photo: PHOTOS.ielts,
  });

  return (
    <ToolFrame locale={locale} structuredData={graph}>
      <ToolHero hero={c.hero} chrome={chrome} locale={locale} photo={PHOTOS.ielts} />

      <section className="tl-shell tl-section" id="calculator" aria-labelledby="calc-title">
        <SectionHead id="calc-title" kicker={c.hero.eyebrow} title={c.overall.title} hint={c.overall.hint} />
        <div style={{ marginTop: 26 }}>
          <IeltsCalculator copy={{ overall: c.overall, raw: c.raw }} />
        </div>
      </section>

      <section className="tl-shell tl-section" aria-labelledby="tables-title">
        <SectionHead id="tables-title" kicker={c.tables.eyebrow} title={c.tables.title} hint={c.tables.hint} />
        <div className="tl-tables" style={{ marginTop: 26 }}>
          {TABLES.map((t) => (
            <ScoreTable key={t} title={c.raw.tabs[t]} table={t} copy={c.tables} />
          ))}
        </div>
      </section>

      <section className="tl-shell tl-section" aria-labelledby="cefr-title">
        <SectionHead id="cefr-title" kicker={c.cefr.eyebrow} title={c.cefr.title} hint={c.cefr.hint} />
        <div className="tl-ladder" style={{ marginTop: 26, maxWidth: 760 }}>
          {IELTS_CEFR.map((r, i) => (
            <div
              key={r.level}
              className="tl-rung"
              // Each rung a little wider than the one above: the ladder reads
              // as a climb without a word of explanation.
              style={{ backgroundImage: levelBackground(r.level), width: `${100 - (IELTS_CEFR.length - 1 - i) * 7}%` }}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, color: WHITE }}>{r.level}</span>
              <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: WHITE }}>
                {fill(c.cefr.band, { from: r.from.toFixed(1), to: r.to.toFixed(1) })}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: "16px 0 0", maxWidth: 760 }}>{c.cefr.note}</p>
      </section>

      <ToolCross
        chrome={chrome}
        cross={c.cross}
        href={localePath(MULTILEVEL_CALCULATOR_PATH, locale)}
        photo={PHOTOS.multilevel}
        photoAlt={multilevel.hero.photoAlt}
      />
      <ToolCta
        chrome={chrome}
        practice={(["listening", "reading", "writing"] as const).map((s) => ({ label: c.overall.skills[s], href: freePracticePage(s) }))}
      />
      <ToolFaq chrome={chrome} faq={c.faq} />
      <ToolDisclaimer chrome={chrome} />
    </ToolFrame>
  );
}

/** One raw-score table, in text — the "ielts score table" a searcher wants to
 *  read without touching the widget, and what a crawler indexes. */
function ScoreTable({ title, table, copy }: { title: string; table: RawTable; copy: IeltsCopy["tables"] }) {
  const rows = rawRanges(table);
  const lowest = rows[rows.length - 1].from;
  return (
    <div className="tl-card" style={{ padding: 20 }}>
      <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: INK, margin: "0 0 12px" }}>{title}</h3>
      <table className="tl-table">
        <thead>
          <tr>
            <th scope="col">{copy.correct}</th>
            <th scope="col">{copy.band}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.band}>
              <td>{r.from === r.to ? r.from : `${r.from}–${r.to}`}</td>
              <td>{r.band.toFixed(1)}</td>
            </tr>
          ))}
          <tr>
            <td>0–{lowest - 1}</td>
            <td>{copy.below}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
