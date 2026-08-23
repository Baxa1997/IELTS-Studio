import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "IELTS Writing Practice — Task 1 & Task 2 with Real Band Feedback",
  description:
    "Write Task 1 and Task 2 essays and get per-criterion bands (TR, CC, LR, GRA) with evidence quoted from your own writing — then revise the same essay and watch the band move. Calibrated and strict.",
  alternates: { canonical: "/ielts-writing-practice" },
  robots: { index: true, follow: true },
};

export default function IeltsWritingPracticePage() {
  return (
    <article>
      <PageTitle
        title="IELTS Writing practice that coaches one essay, not fifty"
        lead="Every AI tool will give you a band and a paragraph of advice. Almost none will let you fix the essay and be re-marked on it — which is the only part that actually teaches you anything. That loop is what we built the platform around."
      />

      <Sec title="The revision loop">
        <P>
          Write an essay. Get it marked. Then <B>rewrite that same essay</B> and submit it again. The
          grader re-reads it and tells you whether the thing that was capping you is fixed — and if your
          band did not move, why not.
        </P>
        <P>
          This sounds small and it is not. Score-and-move-on tools train you to produce a lot of
          mediocre essays; a candidate who writes twenty essays and never revises one is practising their
          existing habits twenty times. The revision loop is the difference between measurement and
          coaching, and it is why we ask you to write fewer essays and fix more of them.
        </P>
      </Sec>

      <Sec title="What the feedback actually contains">
        <P>
          You get all four official criteria scored separately — <B>Task Response</B>,{" "}
          <B>Coherence &amp; Cohesion</B>, <B>Lexical Resource</B>, and{" "}
          <B>Grammatical Range &amp; Accuracy</B> — and for each one:
        </P>
        <UL>
          <LI>
            <B>The band</B>, grounded in the official public band descriptors rather than the
            model&rsquo;s general impression.
          </LI>
          <LI>
            <B>The evidence</B> — actual lines quoted from your essay, so you can see what the score is
            based on and argue with it by fixing the writing.
          </LI>
          <LI>
            <B>What is capping it</B> — the single specific thing standing between you and the next half
            band, named rather than gestured at.
          </LI>
          <LI>
            <B>The fix</B>, plus a &ldquo;band with fixes&rdquo; target so you know what the essay is
            worth if you do the work.
          </LI>
        </UL>
        <P>
          You also get a Band 9 model answer to the same prompt, so &ldquo;what would better have looked
          like&rdquo; is a document you can read rather than a mystery.
        </P>
      </Sec>

      <Sec title="Strict on purpose">
        <P>
          Our grader is calibrated against expert-judged essays and tuned to sit <B>slightly below</B> a
          human examiner. When your essay lands between two bands, it rounds down and tells you what is
          missing from the higher one.
        </P>
        <P>
          That is a deliberate product decision and occasionally an unpopular one. An inflated 7.0 feels
          good for a week and costs you on results day; an honest 6.5 with a named gap is something you
          can act on this evening. Try it without an account on the free{" "}
          <A href="/grade">IELTS writing checker</A>.
        </P>
        <P>
          One thing worth knowing if you have been taught to write from a memorised template: examiners
          have been marking templated essays down hard, and Task Response is where it shows. Our grader
          reflects that, so a template that scored well two years ago may come back lower than you expect.
        </P>
      </Sec>

      <Sec title="Prompts and the studio">
        <P>
          Task 1 and Task 2 prompts are <B>generated fresh</B> for every session across the real
          question categories, so you are never rehearsing an essay you have already seen. You write in a
          distraction-free studio with a timer and autosave — the timer matters, because Task 2 in forty
          minutes is a different skill from Task 2 in an afternoon, and it is the one being tested.
        </P>
      </Sec>

      <Sec title="The other three skills">
        <P>
          Writing sits alongside <A href="/ielts-reading-practice">Reading</A>,{" "}
          <A href="/ielts-listening-practice">Listening</A> and{" "}
          <A href="/ielts-speaking-practice">Speaking</A> in one account — see{" "}
          <A href="/ielts-practice">all four together</A>. Teaching a class?{" "}
          <A href="/for-education-centers">Assign essays and read the reports</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Can I resubmit the same essay after improving it?",
            a: "Yes — that is the core of the product. You revise the same essay and it is re-marked, so you can see whether the thing capping your band is actually fixed. Most tools score an essay once and move you on to a new prompt.",
          },
          {
            q: "Does it grade Task 1 as well as Task 2?",
            a: "Both. Task 1 and Task 2 prompts are generated fresh each session and marked on the four official criteria.",
          },
          {
            q: "How accurate is the writing band?",
            a: "The grader is calibrated against expert-judged essays and deliberately tuned to be conservative — when an essay sits between two bands it rounds down and names what is missing for the higher one. The goal is that your practice band matches or slightly understates your exam-day band, never overstates it.",
          },
          {
            q: "Will it mark down a templated essay?",
            a: "Yes. Examiners have been penalising memorised template language heavily, particularly under Task Response, and our grader reflects that. If you have been taught a rigid template, expect a lower band here than older practice material may have led you to expect.",
          },
          {
            q: "Do I get to see what a Band 9 answer looks like?",
            a: "Yes — you get a model answer to the same prompt you just wrote on, so you can compare your essay against a version that does what the descriptors ask for.",
          },
        ]}
      />

      <Cta
        title="Get one essay marked properly"
        sub="Per-criterion bands with evidence, the thing capping you, and the fix — free, no card needed."
      />
      <Related current="/ielts-writing-practice" />
    </article>
  );
}
