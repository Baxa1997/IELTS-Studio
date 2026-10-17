import type { IeltsSkill, MultilevelLevel, MultilevelSection, RawTable } from "../scores";

/**
 * Every word on the two calculator pages, per language.
 *
 * A TYPED OBJECT PER LOCALE, like the guides' `docsCopy`, rather than a few
 * hundred `lp.*` keys: the copy is long, structured (FAQ lists, per-skill
 * labels) and read by these two pages only. `uz.ts` and `ru.ts` do not compile
 * until they carry every field `en.ts` has.
 *
 * Templates hold `{name}` slots, filled by `fill()` in `./index`.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface PageMeta {
  title: string;
  description: string;
  ogTitle: string;
  keywords: string[];
}

export interface HeroCopy {
  eyebrow: string;
  title: string;
  lede: string;
  chips: string[];
  photoAlt: string;
  /** The small card over the photo — a sample result. */
  badgeLabel: string;
  badgeValue: string;
  badgeNote: string;
}

/** Pieces both pages share. */
export interface ToolChrome {
  home: string;
  /** The breadcrumb trail's accessible name. */
  breadcrumb: string;
  /** "Photo: {name} / Unsplash" */
  photoCredit: string;
  faqTitle: string;
  faqEyebrow: string;
  disclaimer: string;
  ctaEyebrow: string;
  ctaWritingTitle: string;
  ctaWritingBody: string;
  ctaWritingButton: string;
  ctaPracticeTitle: string;
  ctaPracticeBody: string;
  ctaAccount: string;
  ctaAccountNote: string;
  crossEyebrow: string;
}

export interface IeltsCopy {
  meta: PageMeta;
  hero: HeroCopy;
  overall: {
    title: string;
    hint: string;
    skills: Record<IeltsSkill, string>;
    minus: string;
    plus: string;
    resultLabel: string;
    /** "Average of the four: {avg}" */
    average: string;
    exact: string;
    /** "{avg} ends in .25, so it rounds up to {band}." */
    upQuarter: string;
    upThreeQuarters: string;
    nearest: string;
    cefr: string;
    belowB1: string;
    /** "+{raise} in {skill} lifts your overall band to {next}." */
    next: string;
    top: string;
    /** Band 1–9 → the official one-line description. */
    descriptions: Record<number, string>;
  };
  raw: {
    title: string;
    hint: string;
    tabs: Record<RawTable, string>;
    correct: string;
    /** "{n} of 40 correct" */
    outOf: string;
    band: string;
    below: string;
    /** "Use as my {skill} band" */
    use: string;
    used: string;
    note: string;
  };
  tables: {
    eyebrow: string;
    title: string;
    hint: string;
    correct: string;
    band: string;
    below: string;
  };
  cefr: {
    eyebrow: string;
    title: string;
    hint: string;
    band: string;
    note: string;
  };
  faq: FaqItem[];
  cross: { title: string; body: string; cta: string };
}

export interface MultilevelCopy {
  meta: PageMeta;
  hero: HeroCopy;
  levelNames: Record<MultilevelLevel, string>;
  overall: {
    title: string;
    hint: string;
    sections: Record<MultilevelSection, string>;
    /** "of {max}" */
    outOf: string;
    resultLabel: string;
    /** "Average {avg} of 75" */
    average: string;
    /** "{avg} sits between {lower} and {upper} …" */
    borderline: string;
    /** "To reach {level}: +{points} in total across the four sections." */
    next: string;
    top: string;
    scale: string;
  };
  rater: {
    title: string;
    hint: string;
    writing: string;
    speaking: string;
    task1: string;
    task2: string;
    speakingMark: string;
    /** "Mark {mark} of 36" */
    mark: string;
    /** "{score} of 75" */
    score: string;
    use: string;
    used: string;
    note: string;
  };
  correct: {
    title: string;
    hint: string;
    label: string;
    /** "{n} of 35 correct" */
    outOf: string;
    result: string;
    note: string;
  };
  tables: {
    eyebrow: string;
    title: string;
    hint: string;
    level: string;
    score: string;
    correct: string;
    raterTitle: string;
    raterHint: string;
    mark: string;
    points: string;
  };
  faq: FaqItem[];
  cross: { title: string; body: string; cta: string };
  /** The free CEFR practice, in the next-step band. */
  practiceLink: string;
}

export interface ToolsCopy {
  chrome: ToolChrome;
  ielts: IeltsCopy;
  multilevel: MultilevelCopy;
}
