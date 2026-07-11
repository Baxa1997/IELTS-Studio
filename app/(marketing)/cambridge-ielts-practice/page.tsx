import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "Cambridge-Style IELTS Practice Tests — Unlimited & Original",
  description:
    "Practice IELTS in the exact Cambridge test format — every question type, every layout — with unlimited fresh AI-generated tests, band scores and answer explanations.",
  alternates: { canonical: "/cambridge-ielts-practice" },
  robots: { index: true, follow: true },
};

export default function CambridgePracticePage() {
  return (
    <article>
      <PageTitle
        title="Cambridge-style IELTS practice, without running out of tests"
        lead="The Cambridge practice books are the gold standard — and everyone hits the same wall: there are only so many of them, and the second pass tests your memory, not your English. EngProgress generates unlimited original tests in the same authentic format."
      />

      <Sec title="What “Cambridge-style” means here">
        <P>
          We studied the structure of the official practice-book format in detail — the parts, the question
          types, the layouts, the pacing — and built our generator to match it, so nothing about the real
          exam&rsquo;s format surprises you:
        </P>
        <UL>
          <LI>
            <B>Listening:</B> four parts, 40 questions. Form, note, table and sentence completion in Parts
            1 and 4; map and plan labelling, matching and multiple choice in Part 2; discussion-based
            multiple choice, choose-TWO and flow-charts in Part 3 — with multi-voice audio, the standard
            narrator framing, and question-group structures that mirror the real papers.
          </LI>
          <LI>
            <B>Reading:</B> three academic passages of increasing difficulty with matching headings,
            matching features, True/False/Not Given, Yes/No/Not Given, note completion, sentence endings,
            pick-TWO multiple choice and summary completion — with the group-level word-limit instructions
            laid out the way the books print them.
          </LI>
          <LI>
            <B>Writing:</B> Task 1 report prompts and Task 2 essays across every modern question category,
            including the newer &ldquo;outweigh&rdquo; advantages/disadvantages and positive/negative
            development phrasings.
          </LI>
        </UL>
        <P>
          Listening and Reading are graded on the standard 40-question raw-score-to-band conversion, and
          the difficulty ladder is calibrated so the benchmark level plays like a real test — not a
          softened one.
        </P>
      </Sec>

      <Sec title="Why not just reuse the books?">
        <UL>
          <LI>
            <B>They run out.</B> A serious candidate finishes the recent books in weeks — then what?
          </LI>
          <LI>
            <B>You memorise answers.</B> By the second attempt your score measures recall, not readiness.
          </LI>
          <LI>
            <B>No feedback.</B> A book tells you the answer was C. EngProgress tells you{" "}
            <B>why the trap caught you</B> — on every wrong answer, in Listening and Reading — and tracks
            which question types cost you the most marks.
          </LI>
        </UL>
        <P>
          With generated tests, every practice is a first attempt. Take a full timed test when you want the
          real experience, or a ten-minute single-part quick practice when that is what your day allows.
        </P>
      </Sec>

      <Sec title="Original content — on purpose">
        <P>
          EngProgress never hosts, copies or paraphrases the official Cambridge practice tests or any other
          copyrighted material. Every passage, script and question is original, generated in the authentic
          format and quality-checked before it reaches you. That is both a legal principle and a product
          feature: content nobody has seen before is the only content that measures you honestly.
        </P>
        <P>
          Want to see the rest of the platform first? Start with the overview of{" "}
          <A href="/ielts-practice">IELTS practice on EngProgress</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Are these the real Cambridge IELTS tests?",
            a: "No — and that is deliberate. EngProgress generates original tests that match the Cambridge format: the same parts, question types, layouts and difficulty. We never host or copy copyrighted tests, which means every practice you take is one you have never seen before.",
          },
          {
            q: "How many practice tests are there?",
            a: "The library holds full curated Listening tests across six difficulty levels plus single-part quick practices, and Reading and Writing tasks are generated fresh on demand — so there is effectively no limit.",
          },
          {
            q: "Are the tests as hard as the real exam?",
            a: "The difficulty ladder is calibrated so the benchmark level plays like a real paper, with easier levels to build up on and harder levels to overtrain. Band scoring uses the standard 40-question conversion and is deliberately conservative.",
          },
          {
            q: "Can I practice specific question types?",
            a: "Yes. Quick practices target a single part and question-format combination — for example map labelling, flow-charts or table completion in Listening — and your analytics show which types need the work.",
          },
          {
            q: "Is EngProgress affiliated with Cambridge?",
            a: "No. EngProgress is not affiliated with or endorsed by Cambridge Assessment English, IELTS, the British Council, or IDP. “Cambridge-style” describes the test format our original content follows.",
          },
        ]}
      />

      <Cta
        title="Take a Cambridge-style test you've never seen"
        sub="Full 40-question tests or ten-minute quick practices — generated fresh, graded strictly."
      />
      <Related current="/cambridge-ielts-practice" />
    </article>
  );
}
