import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { eyebrow, INK, SANS, WHITE } from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import {
  CrossLink,
  DocsHead,
  Sidebar,
  Steps,
  type DocGroup,
  type DocStep,
  type InfoTab,
} from "./docs-ui";
import { InfoTabs } from "./info-tabs";

/**
 * "How to use EngProgress" — FOR AN INDIVIDUAL LEARNER.
 *
 * Centres have their own guide at `/how-to-use/education-centers`, because the
 * two audiences want opposite things: a learner needs "how do I get a band and
 * act on it", a centre needs "how do I run teachers, groups, money and
 * Telegram". The band at the foot of this page is the route across.
 *
 * Top-level rather than inside `(marketing)`: that group's layout still applies
 * the old indigo `chrome.tsx`, and this page wears the canvas chrome.
 */

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const DESCRIPTION =
  "How to use EngProgress as a learner: find your real band, practise Writing, Reading, Listening and Speaking with AI marking, and act on the report to reach your target.";

export const metadata: Metadata = {
  title: "How to use EngProgress — a guide for learners",
  description: DESCRIPTION,
  alternates: { canonical: "/how-to-use" },
  openGraph: {
    type: "article",
    url: "/how-to-use",
    title: "How to use EngProgress",
    description: DESCRIPTION,
  },
};

const SIDEBAR: DocGroup[] = [
  {
    group: "On this page",
    items: [
      { label: "Overview", href: "/how-to-use" },
      { label: "What it does", href: "/how-to-use#what" },
      { label: "Three steps", href: "/how-to-use#steps" },
    ],
  },
  {
    group: "Elsewhere",
    items: [{ label: "For education centers", href: "/how-to-use/education-centers" }],
  },
];

const TABS: InfoTab[] = [
  {
    icon: "✎",
    title: "Writing",
    lede: "Task 1 and Task 2, marked the way an examiner marks them — a band per criterion, with the words from your own essay that earned it.",
    points: [
      {
        title: "Four criteria, separately",
        body: "Task Response, Coherence & Cohesion, Lexical Resource and Grammatical Range each get their own band, so you know which one is holding the score down.",
      },
      {
        title: "Evidence, not opinions",
        body: "Every criterion quotes the sentence it is judging. You can check the marking rather than take it on trust.",
      },
      {
        title: "The revision loop",
        body: "Rewrite the same essay and submit it again. It is re-graded against the same task, so you see the band move — not a fresh prompt and a fresh guess.",
      },
      {
        title: "Deliberately conservative",
        body: "Sitting between two bands, it rounds DOWN and names what the higher one needs. A band you can repeat on exam day is worth more than a flattering one.",
      },
    ],
  },
  {
    icon: "▤",
    title: "Reading",
    lede: "Original passages in the exam format, every real question type, marked instantly.",
    points: [
      {
        title: "Every question type",
        body: "True/False/Not Given, matching headings, matching features, sentence and note completion, multiple choice including pick-two — the full Cambridge set.",
      },
      {
        title: "Why the trap worked",
        body: "A wrong answer is explained: what the passage actually said, and why the distractor looked right. That is the part that changes your next attempt.",
      },
      {
        title: "Question-type analytics",
        body: "Your misses are grouped by type, so a weakness in True/False/Not Given shows up as a pattern instead of as bad luck.",
      },
      {
        title: "Timed full sections",
        body: "Three passages, forty questions, one clock — converted once over the whole paper using the real raw-score table.",
      },
    ],
  },
  {
    icon: "◷",
    title: "Listening",
    lede: "Full four-part tests with original multi-voice audio, generated for this platform.",
    points: [
      {
        title: "Real multi-voice audio",
        body: "Scripts are written and voiced with distinct speakers, at exam pace — not a single robotic reader working through a transcript.",
      },
      {
        title: "Cambridge-style groups",
        body: "Form completion, maps and plans, matching, multiple choice — laid out the way the paper lays them out.",
      },
      {
        title: "Transcripts, linked",
        body: "Each answer links to the exact line where it was said, so you can hear what you missed instead of wondering.",
      },
      {
        title: "Quick practice or full test",
        body: "One part when you have ten minutes, all four when you want the real thing.",
      },
    ],
  },
  {
    icon: "✦",
    title: "Speaking",
    lede: "A live examiner you can talk to, and a tutor that teaches while you speak.",
    points: [
      {
        title: "The three-part mock",
        body: "Introduction, cue card, discussion — conducted live by an AI examiner, then graded on fluency, lexis, grammar and pronunciation.",
      },
      {
        title: "Part 2 on its own",
        body: "Push to talk, one minute to prepare, two to speak. The cheapest way to fix the part most candidates lose marks on.",
      },
      {
        title: "The speaking tutor",
        body: "Talk to it and it reacts, corrects and teaches every turn — and switches to Uzbek when you do.",
      },
      {
        title: "Delivery measured, not guessed",
        body: "Speech rate, filler count and answer length are computed from your audio, against time actually spent speaking.",
      },
    ],
  },
  {
    icon: "◇",
    title: "CEFR / Multilevel",
    lede: "The Uzbekistan DTM exam, in its own format — not IELTS with the labels changed.",
    points: [
      {
        title: "Reading, 5 parts",
        body: "Thirty-five questions across the five parts the paper actually uses, generated fresh each time.",
      },
      {
        title: "Writing, 3 tasks",
        body: "All three tasks, marked against the CEFR descriptors rather than the IELTS band descriptors.",
      },
      {
        title: "A CEFR level, not a band",
        body: "Results come back as A1–C2, which is what the certificate reports.",
      },
      {
        title: "Listening and Speaking",
        body: "The CEFR papers for these two are not built yet.",
        soon: true,
      },
    ],
  },
  {
    icon: "◑",
    title: "Your progress",
    lede: "The platform keeps track so you do not have to.",
    points: [
      {
        title: "Current band to target band",
        body: "An estimate per skill, re-derived conservatively as you practise — and the weakest one surfaced.",
      },
      {
        title: "Everything is reopenable",
        body: "Every graded attempt stays in your history with the full report exactly as it was written.",
      },
      {
        title: "Original content only",
        body: "No past papers, ever. Every task is generated, so nothing can be memorised in advance — and it stays on the right side of copyright.",
      },
      {
        title: "Try it without an account",
        body: "The free grader takes a pasted essay and returns a band and the first fix, with no sign-up.",
      },
    ],
  },
];

const STEPS: DocStep[] = [
  {
    n: "01",
    title: "Find your real band",
    body: "Paste an essay into the free grader, or take a full task once you have an account. You get a band and the criterion that is holding it down.",
  },
  {
    n: "02",
    title: "Practise on demand",
    body: "Fresh tasks are generated at your level across all four skills and marked against the official criteria — never a past paper, so nothing can be memorised.",
  },
  {
    n: "03",
    title: "Close the gap",
    body: "Every report names what is missing for the next half band and the work that fixes it. Resubmit the same essay and watch the band move.",
  },
];

export default function HowToUse() {
  const site = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to use EngProgress",
    description: DESCRIPTION,
    url: `${site}/how-to-use`,
    publisher: { "@type": "Organization", name: SITE_NAME, url: site },
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <div
      className={`${sora.variable} ${manrope.variable}`}
      style={{ background: WHITE, fontFamily: SANS, color: INK, minHeight: "100%" }}
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
        <Sidebar groups={SIDEBAR} current="Overview" />

        <div style={{ flex: "1 1 460px", minWidth: 0, padding: "52px 0 96px" }}>
          <DocsHead
            kicker="Documentation · for learners"
            title="How to use EngProgress"
            lede="Everything needed to find your real band and move it — from a first free essay to full mock tests across all four skills and CEFR."
          />

          <div id="what" style={{ ...eyebrow(true), marginTop: 54 }}>
            What the platform does
          </div>
          <InfoTabs tabs={TABS} />

          <div id="steps" style={{ ...eyebrow(true), marginTop: 54 }}>
            Three steps to your first score
          </div>
          <Steps steps={STEPS} />

          {/* the route across to the centre guide */}
          <CrossLink
            kicker="Running a school?"
            title="There is a separate guide for education centers"
            body="Teachers, groups, student logins, assigned homework, Telegram notifications, attendance, reports and finance — all of it is covered in its own guide."
            cta="Open the center guide"
            href="/how-to-use/education-centers"
          />
        </div>
      </main>

      <CentersBand />
      <SiteFooter />
    </div>
  );
}
