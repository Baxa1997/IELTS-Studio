import type { Metadata } from "next";

import { A, B, Cta, Faq, LI, P, PageTitle, Related, Sec, UL } from "../marketing";

export const metadata: Metadata = {
  title: "IELTS Reading Practice — Every Question Type, With Trap Explanations",
  description:
    "Original IELTS Reading passages with every real question type, auto-graded — plus an explanation of why each trap worked on you, and analytics showing which question types cost you the most marks.",
  alternates: { canonical: "/ielts-reading-practice" },
  robots: { index: true, follow: true },
};

export default function IeltsReadingPracticePage() {
  return (
    <article>
      <PageTitle
        title="IELTS Reading practice that explains the traps"
        lead="Knowing you got question 14 wrong teaches you nothing. Knowing that you picked False where the answer was Not Given — because the passage never actually made the comparison you assumed it did — teaches you the whole question type."
      />

      <Sec title="Every question type the real exam uses">
        <P>
          Passages are generated in the authentic academic style and laid out the way the exam lays them
          out, with questions grouped exactly as Cambridge groups them — including the per-group word
          limit, which is a rule candidates lose marks to constantly.
        </P>
        <UL>
          <LI>Matching headings, and matching features to a list of options</LI>
          <LI>True / False / Not Given, and Yes / No / Not Given</LI>
          <LI>Note, table, summary, sentence and flow-chart completion</LI>
          <LI>Sentence endings, multiple choice, and pick-two multiple choice</LI>
          <LI>Diagram and map labelling, and matching information to paragraphs</LI>
        </UL>
      </Sec>

      <Sec title="Why the trap worked">
        <P>
          After you submit, every wrong answer comes back with two things: the <B>proving sentence</B>{" "}
          from the passage that establishes the correct answer, and an explanation of{" "}
          <B>why the distractor caught you</B> — the synonym you took at face value, the qualifier you
          read past, the claim the passage attributed to somebody else rather than asserting itself.
        </P>
        <P>
          IELTS Reading is not really a reading test; it is a test of whether you can resist plausible
          wrong answers under time pressure. Those wrong answers are constructed deliberately, and once
          you can name the four or five ways they are constructed, your score moves in a way that
          re-reading passages never achieves.
        </P>
      </Sec>

      <Sec title="Know which question types are costing you">
        <P>
          Analytics break your accuracy down <B>by question type</B>, so instead of &ldquo;reading is my
          weak skill&rdquo; you get &ldquo;you are at 90% on completion questions and 45% on Not
          Given&rdquo;. That turns a vague worry into an afternoon of specific practice.
        </P>
        <P>
          There is a <B>timed full-section mode</B> too, for when the problem is not comprehension but
          pace — which for most candidates sitting a full paper it is.
        </P>
      </Sec>

      <Sec title="Fresh passages, forever">
        <P>
          Practice books run out. The second time you sit a test you are measuring your memory, not your
          English. Every passage here is <B>generated new</B> in the authentic exam format, so there is
          no recycled PDF and no answer key you have half-remembered. If you specifically want the
          Cambridge-book experience, that format is what the generator was built against — see{" "}
          <A href="/how-to-use#cambridge-style">how Cambridge-style practice works</A>.
        </P>
        <P>
          All content is original. We never host or reproduce official past papers or copyrighted
          practice books.
        </P>
      </Sec>

      <Sec title="The other three skills">
        <P>
          Reading sits alongside <A href="/ielts-writing-practice">Writing</A>,{" "}
          <A href="/ielts-listening-practice">Listening</A> and{" "}
          <A href="/ielts-speaking-practice">Speaking</A> — see{" "}
          <A href="/ielts-practice">all four together</A>. Preparing for the Uzbekistan Multilevel exam
          instead? That paper has its own five-part structure —{" "}
          <A href="/cefr-multilevel-practice">practise the real thing</A>.
        </P>
      </Sec>

      <Faq
        items={[
          {
            q: "Which IELTS Reading question types are covered?",
            a: "All of the real ones: matching headings, matching features, matching information to paragraphs, True/False/Not Given, Yes/No/Not Given, note, table, summary, sentence and flow-chart completion, sentence endings, multiple choice, pick-two multiple choice, and diagram and map labelling.",
          },
          {
            q: "Do I find out why my answer was wrong?",
            a: "Yes. Each wrong answer comes with the sentence in the passage that proves the correct answer, plus an explanation of why the distractor you chose was designed to catch you.",
          },
          {
            q: "Can I practise under exam time pressure?",
            a: "Yes — there is a timed full-section mode alongside untimed practice. For most candidates pace, not comprehension, is what caps the reading band.",
          },
          {
            q: "Are these real past papers?",
            a: "No, deliberately. Every passage and question set is original and AI-generated in the authentic exam format. We never host or copy official past papers or copyrighted practice books — which also means you can never sit a test you have already memorised.",
          },
          {
            q: "How do I know which question types to work on?",
            a: "Analytics break your accuracy down by question type, so you can see exactly where the marks are going — for example strong on completion questions but weak on Not Given — and practise that specifically.",
          },
        ]}
      />

      <Cta
        title="Take a reading test and see the traps"
        sub="Original passages, every real question type, and an explanation for every answer you miss."
      />
      <Related current="/ielts-reading-practice" />
    </article>
  );
}
