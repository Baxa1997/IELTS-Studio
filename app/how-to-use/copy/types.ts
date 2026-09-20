/**
 * The shape of the documentation copy, in one place so the three languages
 * cannot drift apart.
 *
 * ⚠️ WHY THIS IS NOT IN `lib/i18n/messages`. That dictionary is UI chrome —
 * nav labels, buttons, empty states — and it is imported by `locale-provider`,
 * which is a client component: all three dictionaries ship to the browser on
 * every page, 94 KB of them today. These two guides are about 7,000 words each;
 * putting them in there would roughly double the bundle on every route in the
 * app, including the landing page that is already slow. So the guides keep
 * their copy here, server-side, and only the ONE locale being rendered crosses
 * into the payload.
 *
 * ⚠️ THE TUPLES ARE LOAD-BEARING. `overview`, `steps` and `roles` are fixed
 * length on purpose: a translator who drops a paragraph gets a type error
 * rather than a page that renders three paragraphs in English and two in
 * Uzbek. `uz.ts` and `ru.ts` are typed against these, so a key added here fails
 * to compile until every language carries it — the same guarantee `en.ts` gives
 * the message dictionary.
 *
 * WHAT IS NOT HERE: icons, `soon` flags and hrefs. Those are structure, not
 * language, and they stay in the pages so a translation cannot accidentally
 * mark a shipped feature as coming soon.
 */

/** A titled paragraph — a feature, a role, a bullet inside a tab. */
export interface DocPoint {
  title: string;
  body: string;
}

/** One step of a numbered "getting started" list. The number is structural. */
export interface DocStepCopy {
  title: string;
  body: string;
}

/**
 * One tab of a guide. `how` is the long explanatory paragraph that sits above
 * the bullets; the Overview tab has none because it renders a panel instead.
 */
export interface DocTabCopy {
  title: string;
  lede: string;
  how?: string;
  points?: DocPoint[];
}

/** Page `<head>` copy. `ogTitle` is usually shorter than `title`. */
export interface DocMetaCopy {
  title: string;
  description: string;
  ogTitle: string;
}

/** The band at the foot of each guide pointing at the other one. */
export interface DocCrossCopy {
  kicker: string;
  title: string;
  body: string;
  cta: string;
}

export interface DocHeadCopy {
  kicker: string;
  title: string;
  lede: string;
}

/** The learner's guide — `/how-to-use`. */
export interface LearnerCopy {
  meta: DocMetaCopy;
  head: DocHeadCopy;
  /** Accessible name of the tab list. */
  label: string;
  /** Label of the link across to the centre guide, in the tab rail. */
  elsewhere: string;
  overview: readonly [string, string, string, string];
  featuresHeading: string;
  features: readonly DocPoint[];
  callout: { kicker: string; body: string };
  startHeading: string;
  steps: readonly [DocStepCopy, DocStepCopy, DocStepCopy];
  tabs: {
    overview: DocTabCopy;
    writing: DocTabCopy;
    reading: DocTabCopy;
    listening: DocTabCopy;
    speaking: DocTabCopy;
    cambridge: DocTabCopy;
    coaching: DocTabCopy;
    cefr: DocTabCopy;
  };
  cross: DocCrossCopy;
}

/** The education centre's guide — `/how-to-use/education-centers`. */
export interface CentersCopy {
  meta: DocMetaCopy;
  head: DocHeadCopy;
  label: string;
  elsewhere: string;
  intro: readonly [string, string, string];
  rolesHeading: string;
  roles: readonly [DocPoint, DocPoint, DocPoint, DocPoint];
  startHeading: string;
  steps: readonly [DocStepCopy, DocStepCopy, DocStepCopy];
  tabs: {
    overview: DocTabCopy;
    people: DocTabCopy;
    homework: DocTabCopy;
    tracking: DocTabCopy;
    telegram: DocTabCopy;
    chat: DocTabCopy;
    money: DocTabCopy;
  };
  cross: DocCrossCopy;
}

export interface DocsCopy {
  learner: LearnerCopy;
  centers: CentersCopy;
}
