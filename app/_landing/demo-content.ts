// Copy for the product demo shown on the landing page and /demo. The screens
// themselves are LIVE coded replicas of the real product UI (see
// `demo-screens.tsx`), keyed by `slug` — there are no screenshots to upload.
// The report proof-strip lives in `demo-screens.tsx` too (REPORT_CARDS).
//
// ⚠️ THE TAB COPY IS KEYS; THE SCREENS ARE NOT. What a tab SAYS about the
// product — its name, its heading, its blurb — is marketing copy and switches
// language with the rest of the page. What the screens SHOW inside is practice
// content: an essay, a passage, an examiner's band feedback. That stays in
// English, because the exam is in English and translating a graded sample would
// mean showing a band nobody could check against the rubric that produced it.

import type { MessageKey } from "@/lib/i18n";

export type DemoTab = {
  /** Must match a key in `SCREENS` (demo-screens.tsx) and the deep-link hash. */
  slug: string;
  label: MessageKey;
  title: MessageKey;
  blurb: MessageKey;
};

export const DEMO_TABS: DemoTab[] = [
  { slug: "writing-feedback", label: "dt.wfLabel", title: "dt.wfTitle", blurb: "dt.wfBlurb" },
  { slug: "writing-studio", label: "dt.wsLabel", title: "dt.wsTitle", blurb: "dt.wsBlurb" },
  { slug: "reading", label: "dt.rdLabel", title: "dt.rdTitle", blurb: "dt.rdBlurb" },
  { slug: "listening", label: "dt.lsLabel", title: "dt.lsTitle", blurb: "dt.lsBlurb" },
  { slug: "speaking", label: "dt.spLabel", title: "dt.spTitle", blurb: "dt.spBlurb" },
  { slug: "coach", label: "dt.coLabel", title: "dt.coTitle", blurb: "dt.coBlurb" },
  { slug: "progress", label: "dt.pgLabel", title: "dt.pgTitle", blurb: "dt.pgBlurb" },
];
