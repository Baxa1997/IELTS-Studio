import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { eyebrow, INK, SANS, WHITE } from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

import {
  CrossLink,
  DocsHead,
  PENDING,
  SectionCards,
  Sidebar,
  Steps,
  type DocGroup,
  type DocSection,
  type DocStep,
} from "./docs-ui";

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
    group: "Getting started",
    items: [
      { label: "Overview", href: "/how-to-use" },
      { label: "Create your account", href: "/sign-up" },
      { label: "Grade an essay free", href: "/grade" },
      { label: "Reading your report", href: PENDING },
    ],
  },
  {
    group: "Practice",
    items: [
      { label: "Writing tasks", href: "/ielts-writing-practice" },
      { label: "Reading tests", href: "/ielts-reading-practice" },
      { label: "Listening tests", href: "/ielts-listening-practice" },
      { label: "Speaking sessions", href: "/ielts-speaking-practice" },
      { label: "CEFR / Multilevel", href: "/cefr-multilevel-practice" },
    ],
  },
  {
    group: "Elsewhere",
    items: [{ label: "For education centers", href: "/how-to-use/education-centers" }],
  },
];

const SECTIONS: DocSection[] = [
  {
    icon: "◷",
    title: "Getting started",
    links: [
      { label: "Create your account", href: "/sign-up" },
      { label: "Grade an essay without signing up", href: "/grade" },
      { label: "See the product working", href: "/demo" },
      { label: "Read your band report", href: PENDING },
    ],
  },
  {
    icon: "✎",
    title: "Writing",
    links: [
      { label: "Task 1 and Task 2 prompts", href: "/ielts-writing-practice" },
      { label: "Per-criterion bands: TR, CC, LR, GRA", href: "/ielts-writing-practice" },
      { label: "The revision loop — resubmit and re-grade", href: PENDING },
      { label: "Compare against a Band 9 answer", href: PENDING },
    ],
  },
  {
    icon: "▤",
    title: "Reading & Listening",
    links: [
      { label: "Reading passages and question types", href: "/ielts-reading-practice" },
      { label: "Why each trap worked", href: "/ielts-reading-practice" },
      { label: "Full four-part listening tests", href: "/ielts-listening-practice" },
      { label: "Transcripts and per-answer notes", href: "/ielts-listening-practice" },
    ],
  },
  {
    icon: "✦",
    title: "Speaking & CEFR",
    links: [
      { label: "The three-part live mock", href: "/ielts-speaking-practice" },
      { label: "Part 2 cue-card practice", href: "/ielts-speaking-practice" },
      { label: "The speaking tutor", href: "/ielts-speaking-practice" },
      { label: "CEFR / Multilevel for the DTM exam", href: "/cefr-multilevel-practice" },
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

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Sections</div>
          <SectionCards sections={SECTIONS} />

          <div style={{ ...eyebrow(true), marginTop: 54 }}>Three steps to your first score</div>
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
