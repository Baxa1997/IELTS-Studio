import type { Metadata } from "next";
import { CentersBand, DESIGN_CSS, SiteFooter, SiteHeader } from "@/app/_landing/design-chrome";
import { landingManrope, landingSora } from "@/app/_landing/fonts";
import { eyebrow, INK, SANS, WHITE } from "@/app/_landing/design";
import { getSiteUrl, SITE_NAME } from "@/lib/seo";

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
import { DocsTabs } from "./docs-tabs";

/**
 * "How to use EngProgress" — FOR AN INDIVIDUAL LEARNER.
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
 * THE GENERATION COPY IS WRITTEN AGAINST THE GENERATORS, NOT THE PITCH. Each
 * skill tab's `how` paragraph describes code that exists:
 *   · writing  — `generateOnDemand` in lib/prompts/service.ts: a topic family
 *     from TOPIC_FAMILIES, a shape from TASK2_CATEGORIES, checked against
 *     `prompt_assignments` + the learner's essays so nothing repeats, and the
 *     Academic Task 1 figure handed to the grader as well as the student.
 *   · reading  — `_resolve_target_band` and `generate_reading_test_for_student`
 *     in the engine's reading/service.py. Reading is THE SKILL THAT READS YOUR
 *     MEASURED BAND (from `skill_estimates`); the other three take a level you
 *     choose. Do not flatten that difference into "everything adapts to you" —
 *     it would be untrue of three skills out of four.
 *   · listening — the level→delivery mapping in the engine's listening/tts.py
 *     (a lecture is ~115 wpm at L1–2 and ~140 at L4–5). Levels are L1–L5, NOT
 *     bands.
 *   · speaking  — the daily grounded-search theme refresh in speaking/topics.py,
 *     and the deliberate split between exam-shaped themes and current ones.
 *
 * Centres have their own guide at `/how-to-use/education-centers`; the band at
 * the foot of this page is the route across.
 *
 * Top-level rather than inside `(marketing)`: that group's layout still applies
 * the old indigo `chrome.tsx`, and this page wears the canvas chrome.
 */

const DESCRIPTION =
  "What EngProgress is and how it works: original IELTS and CEFR practice generated on demand at your level, marked criterion by criterion against the official descriptors, across Writing, Reading, Listening and Speaking.";

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

/* ── what goes inside the Overview tab ─────────────────────────────────────── */

const OVERVIEW: string[] = [
  "EngProgress is an AI examiner for IELTS and for the Uzbek Multilevel (CEFR) exam. It writes practice for you, marks it against the official criteria, and tells you the one thing standing between the band you got and the next half band up. All four IELTS skills are live — Writing, Reading, Listening and Speaking — and the Multilevel exam has its own Reading and Writing papers in their own format rather than IELTS with the labels changed.",
  "It starts wherever you are. If you have never sat the exam and would score a 4, the first tasks are written at a 4 and the coaching assumes nothing; if you are pushing from 7.5 to a 9, they are written there instead. There is no entry level to clear before the platform is useful to you, and no ceiling once you are good.",
  "It is built for someone preparing on their own. Nothing waits on a teacher: you ask for a task, it is generated and served immediately, and the report comes back in the same sitting. You are not left alone with it either — you can ask the tutor for help in the middle of a task, and it will answer without giving the answer away. Education centers run the same platform with teachers, groups and assigned homework on top of it — that has its own guide, linked at the foot of this page.",
  "The part worth understanding before anything else is the marking. Every competitor can put a band on an essay; the number is only worth having if it survives exam day. So the grader is calibrated to sit slightly low: when your work falls between two bands it gives you the lower one and names precisely what the higher one was missing. A 6.5 here is meant to be a real 6.5 in the exam hall, and being told you are not there yet is far cheaper than finding out in July.",
];

const FEATURES: Feature[] = [
  {
    title: "All four skills, plus CEFR",
    body: "Writing, Reading, Listening and Speaking are all live and all graded. The Multilevel Reading and Writing papers run alongside them in their own format.",
  },
  {
    title: "The Cambridge format, unlimited",
    body: "Every part, question type and layout of the official practice-book format — but generated, so you never run out and never re-sit one you can half remember.",
  },
  {
    title: "Original content, generated on demand",
    body: "No past papers, ever. Every passage, prompt, recording and question is written for you when you ask for it, so there is nothing to memorise in advance — and nothing that infringes anyone's copyright.",
  },
  {
    title: "Beginner to Band 9",
    body: "There is no level you have to reach before this is useful. Reading reads your measured band off your own results and builds around it; Listening and Writing take the level you ask for, from a first ever attempt up to a Band 9 push.",
  },
  {
    title: "Coaching while you practise",
    body: "A tutor you can ask mid-task — what to put in this paragraph, where to look in this passage — that teaches the move without handing over the answer while the clock is running.",
  },
  {
    title: "Marked criterion by criterion",
    body: "Each criterion gets its own band, so you can see which one is holding the score down instead of guessing at a single number.",
  },
  {
    title: "Evidence, not opinions",
    body: "Every criterion quotes the sentence from your own work that it is judging. You can check the marking rather than take it on trust.",
  },
  {
    title: "Deliberately conservative",
    body: "Sitting between two bands, it rounds down and states what the higher one needs. A band you can repeat on exam day is worth more than a flattering one.",
  },
  {
    title: "The revision loop",
    body: "Rewrite the same essay and submit it again. It is re-marked against the same task, so you watch the band move — not a fresh prompt and a fresh guess.",
  },
  {
    title: "Wrong answers explained",
    body: "In Reading and Listening a miss is explained: what the text actually said, and why the distractor looked right. That is the part that changes your next attempt.",
  },
  {
    title: "Progress that keeps itself",
    body: "A band per skill, re-derived as you practise, with the weakest surfaced. Every graded attempt stays in your history with its full report exactly as written.",
  },
  {
    title: "Try it without an account",
    body: "The free grader takes a pasted essay and returns a band and the first fix, with no sign-up.",
  },
];

const STEPS: DocStep[] = [
  {
    n: "01",
    title: "Find your real band",
    body: "Paste an essay into the free grader, or sit a full task once you have an account. You get a band and the criterion that is holding it down.",
  },
  {
    n: "02",
    title: "Practise on demand",
    body: "Ask for a task in any of the four skills. It is written for you at your level and marked against the official criteria — never a past paper, so nothing can be memorised.",
  },
  {
    n: "03",
    title: "Close the gap",
    body: "Every report names what is missing for the next half band and the work that fixes it. Rewrite the same essay, resubmit it, and find out whether the band actually moved.",
  },
];

function OverviewPanel() {
  return (
    <>
      <Prose paragraphs={OVERVIEW} />

      <div style={{ ...eyebrow(true), marginTop: 40 }}>Key features</div>
      <FeatureList features={FEATURES} />

      <Callout kicker="The idea the rest of it rests on">
        There is no question bank here and no set of tests to work through. Every task is written the
        moment you ask for it, and the level it is written at comes from you — your measured band for
        a reading paper, the level you pick for a listening test, a topic and question shape you have
        not been given before for an essay. Two learners practising on the same day sit different
        papers, and you never sit the same one twice.
      </Callout>

      <div style={{ ...eyebrow(true), marginTop: 40 }}>Getting started</div>
      <Steps steps={STEPS} />
    </>
  );
}

/* ── the tabs ──────────────────────────────────────────────────────────────── */

const TABS: InfoTab[] = [
  {
    icon: "◆",
    title: "Overview",
    lede: "What EngProgress is, what it gives you, and the three steps from a first essay to a band you can trust.",
    content: <OverviewPanel />,
  },
  {
    icon: "✎",
    title: "Writing",
    lede: "Task 1 and Task 2, marked the way an examiner marks them — a band per criterion, with the words from your own essay that earned it.",
    how: "Ask for a task and one is written on the spot. The generator draws a topic family from the fourteen it rotates through — environment, education, technology, health, work, society, government, globalisation, crime, media, culture, transport, tourism — and, for Task 2, one of the six question shapes the real exam uses: opinion, discussion, problem–solution, two-part, advantages versus disadvantages, and positive or negative development. Before serving it, it checks every prompt you have already been given and every essay you have already written, so the same question never comes round twice. Academic Task 1 goes a step further and draws the chart itself — and the grader is handed that same chart, so it marks the figure you actually saw rather than somebody's description of it.",
    points: [
      {
        title: "Four criteria, separately",
        body: "Task Response, Coherence & Cohesion, Lexical Resource and Grammatical Range each get their own band, so you know which one is capping you.",
      },
      {
        title: "What caps it, and the fix",
        body: "Each criterion says what is holding it at that band and the specific change that would lift it — not general advice about linking words.",
      },
      {
        title: "The revision loop",
        body: "Resubmit the same essay against the same task. Nothing else about the marking changes, so any movement in the band came from your rewrite.",
      },
      {
        title: "A band 9 answer to compare",
        body: "A model answer to the same prompt, so you can see what the criteria look like when they are all met at once.",
      },
    ],
  },
  {
    icon: "▤",
    title: "Reading",
    lede: "Original passages in the exam format, every real question type, marked the moment you submit.",
    how: "This is the skill that reads your level off your own results. Before a word is written, the generator looks up your measured reading band — the one your previous attempts produced — and falls back to your target band, and then to a sensible default, if you are new. A full test is built around that number rather than flat at it: passage 1 lands a band below you, passage 2 at your level and passage 3 a band above, which is how the real paper ramps. One authentic Cambridge question layout is chosen for the whole test so the three passages cohere, the order of the question blocks inside each passage is then shuffled, and each passage is given a different subject and angle so you are not reading three variations on one theme. Every question is finally checked back against the passage it came from, and anything that cannot be confirmed there is thrown away rather than served to you.",
    points: [
      {
        title: "Every question type",
        body: "True/False/Not Given, matching headings, matching features, sentence and note completion, summary completion with a word bank, flow-charts, and multiple choice including pick-two.",
      },
      {
        title: "Why the trap worked",
        body: "A wrong answer is explained against the passage: what it actually said, and what made the distractor look right.",
      },
      {
        title: "Question-type analytics",
        body: "Misses are grouped by type, so a weakness in True/False/Not Given shows up as a pattern instead of as bad luck.",
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
    lede: "Full four-part tests with original multi-voice audio, recorded for this platform.",
    how: "There are two ways in. The shared library holds practices that are already recorded, so they open and play at once. Or make your own: choose a level from L1 to L5 and the engine writes an original script and then performs it as multi-voice audio — a complete four-part, forty-question test in about two and a half minutes, or a single ten-question practice in about two. The level does far more than change the vocabulary; it drives the delivery. A lecture is voiced at roughly 115 words a minute at the easy end and about 140 at the hard end. A phone conversation moves from unhurried turn-taking to a fast native pace with barely a gap between speakers, and a student discussion goes from lively to genuinely overlapping. On a quick practice the question format is withheld until the announcer states it, so you cannot rehearse one type and hope it comes up.",
    points: [
      {
        title: "Real multi-voice audio",
        body: "Scripts are written and then performed with distinct speakers and an exam announcer — not one flat reader working through a transcript.",
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
        title: "Ten minutes or the full hour",
        body: "One recording and ten questions when time is short; all four parts and forty questions when you want the real thing.",
      },
    ],
  },
  {
    icon: "✦",
    title: "Speaking",
    lede: "A live examiner you can talk to, and a tutor that teaches while you speak.",
    how: "The examiner is not reading from a fixed list — and the list is not frozen at the model's training cutoff either. The pool of themes is refreshed once a day by a grounded search and shared across the platform, so it cannot quietly go stale, which is the worst way for content to age because nobody notices. From there the two modes pull in deliberately opposite directions. Exam practice keeps timeless, exam-shaped themes — your home town, food, routines, and the durable Part 3 questions about how society changes — because questions built from this week's headlines would be less exam-authentic, not more. Free conversation gets the current topics themselves, because discussing what is actually going on is the whole point of that practice. If a search ever fails, the built-in pool takes over: a lesson never waits on one and never fails because of one.",
    points: [
      {
        title: "The three-part mock",
        body: "Introduction, cue card and discussion, conducted live by an AI examiner rather than a list of recorded questions.",
      },
      {
        title: "Part 2 on its own",
        body: "Push to talk, one minute to prepare, two to speak — the cheapest way to fix the part most candidates lose marks on.",
      },
      {
        title: "The speaking tutor",
        body: "Talk to it and it reacts, corrects and teaches on every turn — and switches to Uzbek when you do.",
      },
      {
        title: "Delivery measured, not guessed",
        body: "Speech rate, filler count and answer length are computed from your audio, against the time you actually spent speaking.",
      },
    ],
  },
  {
    icon: "◈",
    title: "Cambridge-style",
    lede: "The format of the official practice books, without ever running out of tests — and without copying one of them.",
    how: "The generator was built against the structure of the official practice-book format: the parts, the question types, the layouts, the pacing. Listening comes out as four parts and forty questions — form, note, table and sentence completion in Parts 1 and 4; map and plan labelling, matching and multiple choice in Part 2; discussion multiple choice, choose-TWO and flow-charts in Part 3 — with multi-voice audio and the standard narrator framing. Reading comes out as three academic passages of rising difficulty carrying matching headings, matching features, True/False/Not Given, Yes/No/Not Given, note completion, sentence endings, pick-TWO and summary completion, with the group-level word-limit instructions printed the way the books print them. Writing covers Task 1 reports and every modern Task 2 category, including the newer \u201coutweigh\u201d and positive-or-negative-development phrasings. Listening and Reading are then converted on the standard forty-question raw-score table.",
    points: [
      {
        title: "The books run out",
        body: "A serious candidate finishes the recent ones in weeks. Generated tests do not run out, so every practice can be a first attempt.",
      },
      {
        title: "A second pass tests memory",
        body: "Re-sitting a book measures recall, not readiness. Content you have never seen is the only content that measures you honestly.",
      },
      {
        title: "A book cannot explain itself",
        body: "It tells you the answer was C. Here every wrong answer in Reading and Listening explains why the trap caught you, and your misses are grouped by question type.",
      },
      {
        title: "Nothing is copied",
        body: "No official Cambridge test is hosted, copied or paraphrased here. \u201cCambridge-style\u201d describes the format our original content follows — EngProgress is not affiliated with or endorsed by Cambridge Assessment English, IELTS, the British Council or IDP.",
      },
    ],
  },
  {
    icon: "◉",
    title: "Coaching",
    lede: "Scoring tells you where you are. Coaching is the part that moves you — and it is there while you work, not only afterwards.",
    how: "There are four of them, and they are deliberately different things. The Writing tutor and the Reading tutor sit with you DURING the task: ask what belongs in this paragraph, or which two words in this sentence to compare against the passage, and you get a straight answer in the moment. Both are hard-blocked from doing the work for you until you submit — the Writing tutor will not write a sentence of your essay and the Reading tutor will not tell you whether Q7 is True, no matter how you ask. They teach the move on a different example instead, and the full explanations unlock the second you hand the work in, which is what keeps the band yours. The Speaking tutor works the other way round, because speech is live: it reacts, corrects and teaches on every turn while you are talking. The study coach is not attached to a task at all — it sees your bands, your weakest skill and how many days you have left, and tells you what to do with the time.",
    points: [
      {
        title: "Concrete, or it does not count",
        body: "\u201cAdd more detail\u201d and \u201cuse better vocabulary\u201d are banned outright. A reply has to name the exact word to swap, the exact sentence to add, or the paragraph to look in.",
      },
      {
        title: "It will not do it for you",
        body: "While the clock runs, no model answer, no sentence of your essay, and no confirmation of which option is right. That rule is written into the tutor itself, not left to its judgement.",
      },
      {
        title: "In your own language",
        body: "Write to it in Uzbek or Russian and it answers in the same language. The Speaking tutor switches mid-conversation when you do.",
      },
      {
        title: "It knows where you are",
        body: "Your target band and weakest area are passed in, so the advice is pitched at your level — but it will never quote you a band. Scoring belongs to the examiner.",
      },
    ],
  },
  {
    icon: "◇",
    title: "CEFR / Multilevel",
    lede: "The Uzbekistan exam in its own format — not IELTS with the labels changed.",
    how: "The Multilevel papers are generated on demand like everything else, but against the CEFR descriptors rather than the IELTS band descriptors, because they are a different exam with a different mark scheme. Reading is built as five parts and thirty-five questions in the shapes the real paper uses; Writing is built as all three tasks. A result comes back as a CEFR level rather than a band, which is what the certificate actually reports.",
    points: [
      {
        title: "Reading, five parts",
        body: "Thirty-five questions across the five parts the paper actually uses, generated fresh each time.",
      },
      {
        title: "Writing, three tasks",
        body: "All three tasks, marked against the CEFR descriptors rather than the IELTS band descriptors.",
      },
      {
        title: "A level, not a band",
        body: "Results come back as A1–C2, which is what the Multilevel certificate reports.",
      },
      {
        title: "Listening and Speaking",
        body: "The CEFR papers for these two are not built yet. The IELTS versions of both are live.",
        soon: true,
      },
    ],
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
      className={`${landingSora.variable} ${landingManrope.variable}`}
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
        <DocsTabs
          tabs={TABS}
          label="How to use EngProgress"
          elsewhere={{ label: "For education centers", href: "/how-to-use/education-centers" }}
          head={
            <DocsHead
              kicker="Documentation · for learners"
              title="How to use EngProgress"
              lede="An AI examiner for IELTS and the Multilevel exam, from complete beginner to Band 9: original practice written for you on demand, a tutor beside you while you work, and the next half band spelled out."
            />
          }
          footer={
            /* the route across to the centre guide */
            <CrossLink
              kicker="Running a school?"
              title="There is a separate guide for education centers"
              body="Teachers, groups, student logins, assigned homework, Telegram notifications, attendance, reports and finance — all of it is covered in its own guide."
              cta="Open the center guide"
              href="/how-to-use/education-centers"
            />
          }
        />
      </main>

      <CentersBand />
      <SiteFooter />
    </div>
  );
}
