import type { Metadata } from "next";

import { A, B, CompareTable, Cta, FactsNote, Faq, LI, P, PageTitle, Related, Sec, UL } from "../../marketing";

export const metadata: Metadata = {
  title: "EngProgress vs ielts.gg (2026) — An Honest Comparison",
  description:
    "ielts.gg's fast AI speaking feedback vs EngProgress's calibrated band grading and unlimited fresh Cambridge-style tests. A fair comparison, including who should pick which.",
  alternates: { canonical: "/vs/ielts-gg" },
  robots: { index: true, follow: true },
};

export default function VsIeltsGgPage() {
  return (
    <article>
      <PageTitle
        title="EngProgress vs ielts.gg: an honest comparison"
        lead="ielts.gg (also searched as “ieltsgg”) is a well-known AI prep platform, strongest in speaking. EngProgress is built around one thing: a band score you can trust, with practice generated fresh around it. Here is a fair look at both."
      />

      <Sec title="What ielts.gg does well">
        <P>
          ielts.gg offers AI-powered preparation for Academic IELTS across all four skills, and its
          stand-out feature is <B>speaking</B>: you talk to the AI and get a criterion-by-criterion
          breakdown quickly — reportedly within a minute. It offers unlimited attempts, personalised study
          plans and statistics, exam-mode simulations, and advertises a score guarantee (improve your score
          or receive a refund, per their site). It is subscription-based; per third-party reviews there is
          no permanent free plan.
        </P>
        <P>If daily conversational speaking practice is your number-one gap, ielts.gg is strong there.</P>
      </Sec>

      <Sec title="Where EngProgress is different">
        <UL>
          <LI>
            <B>Calibrated, conservative grading.</B> Our evaluator is grounded in the official public band
            descriptors and calibrated against expert-judged essays. When your essay sits between two
            bands, it rounds down and tells you exactly what the higher band requires. The practice band is
            one you can take to exam day.
          </LI>
          <LI>
            <B>A revision loop.</B> Resubmit the same essay after revising and watch the band move —
            coaching across drafts instead of a new score for every new essay.
          </LI>
          <LI>
            <B>Fresh Cambridge-style tests.</B> Reading and Writing are generated new every time in the
            authentic format; Listening is an original multi-voice library across six difficulty levels
            with transcripts and per-answer trap explanations.
          </LI>
          <LI>
            <B>A real free plan.</B> 5 AI-graded practices every month, no card required.
          </LI>
        </UL>
        <P>
          The honest gap on our side: <B>speaking is not live yet</B> — it is on the roadmap, and we would
          rather ship it calibrated than ship it first.
        </P>
      </Sec>

      <Sec title="Side by side">
        <CompareTable
          left="EngProgress"
          right="ielts.gg"
          rows={[
            {
              label: "Free plan",
              a: "Yes — 5 AI-graded practices/month, no card",
              b: "No permanent free plan (per third-party reviews)",
            },
            {
              label: "Writing feedback",
              a: "Per-criterion evidence, band caps and fixes; conservative calibration; revision loop",
              b: "AI essay feedback with criterion breakdown",
            },
            {
              label: "Speaking",
              a: "Full 3-part live mock with an AI examiner, scored on the four criteria; plus a tutor that teaches while you talk",
              b: "Strong — fast AI speaking feedback, daily practice",
            },
            {
              label: "Reading & Listening",
              a: "Generated fresh in Cambridge-style layout; trap explanations; 6-level listening library",
              b: "Practice with feedback across sections",
            },
            {
              label: "Content model",
              a: "AI-generated fresh every time — never a test you've seen",
              b: "Platform practice bank",
            },
            {
              label: "Guarantee",
              a: "No score guarantee — we promise honest grading instead",
              b: "Score guarantee advertised (improve or refund, per their site)",
            },
            {
              label: "Pricing",
              a: "Free / $5.99/mo (25 practices) / $14.99/mo unlimited",
              b: "Subscription; pricing on their site",
            },
          ]}
        />
      </Sec>

      <Sec title="Which should you pick?">
        <P>
          <B>Pick ielts.gg</B> if speaking is the skill holding you back right now and you want fast
          conversational AI practice with quick feedback.
        </P>
        <P>
          <B>Pick EngProgress</B> if Writing, Reading or Listening is where your marks leak, and you want a
          band score that will not flatter you — with{" "}
          <A href="/cambridge-ielts-practice">fresh Cambridge-style tests</A> you have never seen and a{" "}
          <A href="/ielts-practice">revision loop</A> that improves one essay across drafts. Starting free
          also means you can judge the feedback quality before paying anything.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Is EngProgress a free ielts.gg alternative?",
            a: "For Writing, Reading and Listening, yes: EngProgress has a permanent free plan with 5 AI-graded practices per month and no card required, while ielts.gg is subscription-based. For speaking practice, ielts.gg currently offers more — EngProgress's speaking module is on the roadmap.",
          },
          {
            q: "Which has more accurate band scores?",
            a: "We can only speak for ourselves: EngProgress's grader is grounded in the official public band descriptors, calibrated against expert-judged essays, and tuned to be conservative — it rounds down between bands and names the gap, so your practice band should never overstate your exam-day band.",
          },
          {
            q: "Does EngProgress have a score guarantee?",
            a: "No. We think guarantees belong to marketing and honesty belongs to grading — the promise we make is that the band you see in practice is one you can trust, with the exact gaps to the next band named on every criterion.",
          },
        ]}
      />

      <Cta
        title="Judge the feedback before you pay"
        sub="Start free, submit one essay or take one test, and see what examiner-strict feedback looks like."
      />
      <Related current="/vs/ielts-gg" />
      <FactsNote competitor="ielts.gg" site="ielts.gg" />
    </article>
  );
}
